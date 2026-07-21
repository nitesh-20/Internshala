const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../Model/User");
const { sendEmail, hasMailConfig } = require("../utils/mailer");
const { sendSms } = require("../utils/sms");
const { generateAlphabeticPassword } = require("../utils/passwords");

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
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        error:
          "This account currently uses Google sign-in only. Register a password first to enable email or phone login.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

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
