const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../Model/User");
const OTP = require("../Model/OTP");
const LoginActivity = require("../Model/LoginActivity");
const { sendEmail, hasMailConfig } = require("../utils/mailer");
const { sendSms } = require("../utils/sms");
const { generateAlphabeticPassword } = require("../utils/passwords");
const { requireAuth } = require("../middleware/auth");
const {
  createLoginChallenge,
  getLoginContext,
  getMobileRestrictionError,
  isChromeBrowser,
  saveLoginActivity,
  sendLoginOtp,
  verifyLoginChallengeToken,
} = require("../utils/loginSecurity");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many authentication attempts. Please try again later." },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many reset attempts. Please try again later." },
});

const loginOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many OTP attempts. Please try again later." },
});

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const GENERIC_RESET_SUCCESS =
  "If an account is eligible, a new password has been sent.";
const ONCE_PER_DAY_MESSAGE = "You can use this option only once per day.";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const normalizePhone = (phone = "") => String(phone).replace(/\D/g, "");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email || "",
  phoneNumber: user.phone || "",
  photo: user.photo || "",
  authProvider: user.authProvider,
});

const issueToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email || "",
      phone: user.phone || "",
      authProvider: user.authProvider,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const canRequestPasswordReset = (lastResetAt) => {
  if (!lastResetAt) return true;
  return Date.now() - new Date(lastResetAt).getTime() >= ONE_DAY_MS;
};

const validatePassword = (password = "") => password.length >= 8;

router.post("/register", authLimiter, async (req, res) => {
  try {
    const {
      name,
      email = "",
      phone = "",
      password = "",
    } = req.body;

    const trimmedName = String(name || "").trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!trimmedName || !password) {
      return res.status(400).json({ error: "Name and password are required." });
    }

    if (!normalizedEmail && !normalizedPhone) {
      return res
        .status(400)
        .json({ error: "Provide at least an email or phone number." });
    }

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    if (normalizedPhone && normalizedPhone.length < 10) {
      return res.status(400).json({ error: "Enter a valid phone number." });
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long." });
    }

    let existingEmailUser = normalizedEmail
      ? await User.findOne({ email: normalizedEmail })
      : null;
    let existingPhoneUser = normalizedPhone
      ? await User.findOne({ phone: normalizedPhone })
      : null;

    if (
      existingEmailUser &&
      existingPhoneUser &&
      String(existingEmailUser._id) !== String(existingPhoneUser._id)
    ) {
      return res.status(409).json({
        error: "Email and phone belong to different accounts.",
      });
    }

    const existingUser = existingEmailUser || existingPhoneUser;

    if (existingUser && existingUser.passwordHash) {
      if (existingEmailUser) {
        return res.status(409).json({ error: "Email is already registered." });
      }
      return res.status(409).json({ error: "Phone number is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let user;

    if (existingUser) {
      existingUser.name = trimmedName || existingUser.name;
      if (normalizedEmail) {
        existingUser.email = normalizedEmail;
      }
      if (normalizedPhone) {
        existingUser.phone = normalizedPhone;
      }
      existingUser.passwordHash = passwordHash;
      existingUser.authProvider = "local";
      await existingUser.save();
      user = existingUser;
    } else {
      user = await User.create({
        name: trimmedName,
        email: normalizedEmail || undefined,
        phone: normalizedPhone || undefined,
        passwordHash,
        authProvider: "local",
      });
    }

    return res.status(201).json({
      message: existingUser
        ? "Password login enabled for your existing account."
        : "Registration successful.",
      token: issueToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ error: "Failed to register user." });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { identifier = "", password = "" } = req.body;
    const normalizedEmail = normalizeEmail(identifier);
    const normalizedPhone = normalizePhone(identifier);
    const activityContext = {
      ...getLoginContext(req),
      loginMethod: "Email/Password",
    };

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: "Identifier and password are required." });
    }

    const query = normalizedEmail.includes("@")
      ? { email: normalizedEmail }
      : { phone: normalizedPhone };

    const user = await User.findOne(query);
    if (!user) {
      await saveLoginActivity({
        loginStatus: "Failed",
        loginMethod: "Email/Password",
        context: activityContext,
      });
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (!user.passwordHash) {
      await saveLoginActivity({
        userId: user._id,
        loginStatus: "Failed",
        loginMethod: "Email/Password",
        context: activityContext,
      });
      return res.status(400).json({
        error:
          "This account currently uses Google sign-in only. Register a password first to enable email or phone login.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await saveLoginActivity({
        userId: user._id,
        loginStatus: "Failed",
        loginMethod: "Email/Password",
        context: activityContext,
      });
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const mobileRestrictionError = getMobileRestrictionError(
      activityContext.deviceType
    );
    if (mobileRestrictionError) {
      await saveLoginActivity({
        userId: user._id,
        loginStatus: "Failed",
        loginMethod: "Email/Password",
        context: activityContext,
      });
      return res.status(403).json({ error: mobileRestrictionError });
    }

    if (isChromeBrowser(activityContext.browser)) {
      const challengeResult = await createLoginChallenge({
        user,
        loginMethod: "Email/Password",
        activityContext,
      });

      if (!challengeResult.ok) {
        await saveLoginActivity({
          userId: user._id,
          loginStatus: "Failed",
          loginMethod: "Email/Password",
          context: activityContext,
        });
      }

      return res.status(challengeResult.status).json({
        ...challengeResult.body,
        user: sanitizeUser(user),
      });
    }

    await saveLoginActivity({
      userId: user._id,
      loginStatus: "Success",
      loginMethod: "Email/Password",
      context: activityContext,
    });

    return res.json({
      message: "Login successful.",
      token: issueToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Failed to login." });
  }
});

router.post("/google-sync", async (req, res) => {
  try {
    const { name = "", email = "", photo = "", phoneNumber = "" } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phoneNumber);
    const activityContext = {
      ...getLoginContext(req),
      loginMethod: "Google",
    };

    if (!normalizedEmail) {
      return res.status(400).json({ error: "Email is required." });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        name: String(name || "Google User").trim(),
        email: normalizedEmail,
        phone: normalizedPhone || undefined,
        photo: String(photo || ""),
        authProvider: "google",
      });
    } else {
      user.name = String(name || user.name).trim() || user.name;
      user.photo = String(photo || user.photo || "");
      if (normalizedPhone && !user.phone) {
        user.phone = normalizedPhone;
      }
      user.authProvider = user.authProvider || "google";
      await user.save();
    }

    const mobileRestrictionError = getMobileRestrictionError(
      activityContext.deviceType
    );
    if (mobileRestrictionError) {
      await saveLoginActivity({
        userId: user._id,
        loginStatus: "Failed",
        loginMethod: "Google",
        context: activityContext,
      });
      return res.status(403).json({ error: mobileRestrictionError });
    }

    if (isChromeBrowser(activityContext.browser)) {
      const challengeResult = await createLoginChallenge({
        user,
        loginMethod: "Google",
        activityContext,
      });

      if (!challengeResult.ok) {
        await saveLoginActivity({
          userId: user._id,
          loginStatus: "Failed",
          loginMethod: "Google",
          context: activityContext,
        });
      }

      return res.status(challengeResult.status).json({
        ...challengeResult.body,
        user: sanitizeUser(user),
      });
    }

    await saveLoginActivity({
      userId: user._id,
      loginStatus: "Success",
      loginMethod: "Google",
      context: activityContext,
    });

    return res.json({
      message: "Google user synchronized.",
      token: issueToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Google Sync Error:", error);
    return res.status(500).json({ error: "Failed to sync Google user." });
  }
});

router.post("/login-otp/send", loginOtpLimiter, async (req, res) => {
  try {
    const { pendingToken = "" } = req.body;
    if (!pendingToken) {
      return res.status(400).json({ error: "Pending token is required." });
    }

    const payload = verifyLoginChallengeToken(pendingToken);
    const resendResult = await sendLoginOtp({
      email: payload.email,
      purpose: payload.purpose,
    });

    if (!resendResult.allowed) {
      return res.status(429).json({
        error: `Please wait ${resendResult.retryAfterSeconds} seconds before requesting a new OTP.`,
      });
    }

    return res.json({
      message: "OTP sent to your registered email.",
      resendAfterSeconds: resendResult.retryAfterSeconds,
      expiresInSeconds: resendResult.expiresInSeconds,
    });
  } catch (error) {
    console.error("Login OTP Send Error:", error);
    return res.status(400).json({ error: "Failed to send login OTP." });
  }
});

router.post("/login-otp/verify", loginOtpLimiter, async (req, res) => {
  try {
    const { pendingToken = "", otp = "" } = req.body;
    if (!pendingToken || !otp) {
      return res.status(400).json({ error: "Pending token and OTP are required." });
    }

    const payload = verifyLoginChallengeToken(pendingToken);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Invalid login challenge." });
    }

    const validOtp = await OTP.findOne({
      email: normalizeEmail(payload.email),
      purpose: payload.purpose,
    }).sort({ createdAt: -1 });

    if (!validOtp) {
      await saveLoginActivity({
        userId: user._id,
        loginStatus: "Failed",
        loginMethod: payload.loginMethod,
        context: payload.activityContext || {},
      });
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    if (validOtp.attempts >= 5) {
      await OTP.deleteOne({ _id: validOtp._id });
      await saveLoginActivity({
        userId: user._id,
        loginStatus: "Failed",
        loginMethod: payload.loginMethod,
        context: payload.activityContext || {},
      });
      return res.status(429).json({
        error: "Maximum attempts reached. Please request a new OTP.",
      });
    }

    const isMatch = await bcrypt.compare(otp, validOtp.hashedOtp);
    if (!isMatch) {
      validOtp.attempts += 1;
      await validOtp.save();
      if (validOtp.attempts >= 5) {
        await saveLoginActivity({
          userId: user._id,
          loginStatus: "Failed",
          loginMethod: payload.loginMethod,
          context: payload.activityContext || {},
        });
      }
      return res.status(400).json({
        error: `Invalid OTP. ${5 - validOtp.attempts} attempts remaining.`,
      });
    }

    await OTP.deleteOne({ _id: validOtp._id });
    await saveLoginActivity({
      userId: user._id,
      loginStatus: "Success",
      loginMethod: payload.loginMethod,
      context: payload.activityContext || {},
    });

    return res.json({
      message: "Login successful.",
      token: issueToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login OTP Verify Error:", error);
    return res.status(400).json({ error: "Failed to verify login OTP." });
  }
});

router.get("/login-history", requireAuth, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      LoginActivity.find({ userId: req.authUser._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoginActivity.countDocuments({ userId: req.authUser._id }),
    ]);

    return res.json({
      activities: activities.map((item) => ({
        id: item._id,
        browser: item.browser,
        browserVersion: item.browserVersion,
        operatingSystem: item.operatingSystem,
        deviceType: item.deviceType,
        ipAddress: item.ipAddress,
        loginMethod: item.loginMethod,
        loginStatus: item.loginStatus,
        userAgent: item.userAgent,
        country: item.country,
        city: item.city,
        createdAt: item.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasMore: skip + activities.length < total,
      },
    });
  } catch (error) {
    console.error("Login History Error:", error);
    return res.status(500).json({ error: "Failed to fetch login history." });
  }
});

const handleForgotPassword = async ({ user, method, destination }) => {
  if (!user) {
    return { status: 200, body: { message: GENERIC_RESET_SUCCESS } };
  }

  if (!canRequestPasswordReset(user.lastPasswordResetAt)) {
    return { status: 429, body: { error: ONCE_PER_DAY_MESSAGE } };
  }

  const generatedPassword = generateAlphabeticPassword(12);
  user.passwordHash = await bcrypt.hash(generatedPassword, 10);
  user.lastPasswordResetAt = new Date();
  user.authProvider = "local";
  await user.save();

  const message = `Your new temporary password is: ${generatedPassword}. Please login and change it as soon as possible.`;

  if (method === "email" && destination && hasMailConfig()) {
    await sendEmail({
      to: destination,
      subject: "Your Internshala password has been reset",
      text: message,
    });
  } else if (method === "phone" && destination) {
    await sendSms({ phone: destination, message });
  } else if (method === "email" && destination) {
    console.log(`[EMAIL SIMULATION] To ${destination}: ${message}`);
  }

  console.log(
    `Password reset completed for user ${user._id} via ${method} on ${new Date().toISOString()}`
  );

  return { status: 200, body: { message: GENERIC_RESET_SUCCESS } };
};

router.post("/forgot-password/email", forgotPasswordLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email });
    const result = await handleForgotPassword({
      user,
      method: "email",
      destination: email,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Forgot Password Email Error:", error);
    return res.status(500).json({ error: "Failed to process password reset." });
  }
});

router.post("/forgot-password/phone", forgotPasswordLimiter, async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    const user = await User.findOne({ phone });
    const result = await handleForgotPassword({
      user,
      method: "phone",
      destination: phone,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Forgot Password Phone Error:", error);
    return res.status(500).json({ error: "Failed to process password reset." });
  }
});

module.exports = router;
