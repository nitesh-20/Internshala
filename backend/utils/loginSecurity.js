const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const requestIp = require("request-ip");
const useragent = require("useragent");
const bcrypt = require("bcryptjs");
const OTP = require("../Model/OTP");
const LoginActivity = require("../Model/LoginActivity");
const { sendEmail, hasMailConfig } = require("./mailer");

const LOGIN_OTP_PURPOSE_PREFIX = "LOGIN_SECURITY";
const LOGIN_OTP_EXPIRY_SECONDS = 300;
const LOGIN_OTP_RESEND_SECONDS = 60;
const MOBILE_ALLOWED_START_HOUR = 10;
const MOBILE_ALLOWED_END_HOUR = 13;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const inferDeviceType = (ua = "") => {
  const lowered = String(ua || "").toLowerCase();
  if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(lowered)) {
    return "Tablet";
  }
  if (
    /(mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini)/i.test(
      lowered
    )
  ) {
    return "Mobile";
  }
  if (/(laptop|notebook)/i.test(lowered)) {
    return "Laptop";
  }
  if (lowered) {
    return "Desktop";
  }
  return "Unknown";
};

const getLoginContext = (req) => {
  const uaString = String(req.headers["user-agent"] || "");
  const parsed = useragent.parse(uaString);
  const browser = parsed.family || "Unknown";
  const browserVersion = parsed.toVersion() || "";
  const osFamily = parsed.os?.family || "Unknown";
  const osVersion = parsed.os?.toVersion?.() || "";
  const operatingSystem = [osFamily, osVersion].filter(Boolean).join(" ").trim();
  const deviceType = inferDeviceType(uaString);
  const ipAddress =
    requestIp.getClientIp(req) ||
    req.headers["x-forwarded-for"] ||
    req.ip ||
    "";

  return {
    browser,
    browserVersion,
    operatingSystem,
    deviceType,
    ipAddress: String(ipAddress || "").split(",")[0].trim(),
    loginMethod: "Email/Password",
    userAgent: uaString,
    country: String(
      req.headers["x-vercel-ip-country"] ||
        req.headers["cf-ipcountry"] ||
        req.headers["x-country-code"] ||
        ""
    ),
    city: String(
      req.headers["x-vercel-ip-city"] ||
        req.headers["x-appengine-city"] ||
        req.headers["x-city"] ||
        ""
    ),
  };
};

const isChromeBrowser = (browser = "") => {
  const lowered = String(browser || "").toLowerCase();
  return lowered.includes("chrome") && !lowered.includes("edge") && !lowered.includes("opera");
};

const getMobileRestrictionError = (deviceType = "") => {
  if (deviceType !== "Mobile") {
    return null;
  }

  const currentHour = new Date().getHours();
  if (
    currentHour < MOBILE_ALLOWED_START_HOUR ||
    currentHour >= MOBILE_ALLOWED_END_HOUR
  ) {
    return "Mobile login is allowed only between 10:00 AM and 1:00 PM.";
  }

  return null;
};

const createLoginChallengeToken = ({
  user,
  email,
  loginMethod,
  activityContext,
  purpose,
}) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      type: "login_challenge",
      sub: String(user._id),
      email,
      loginMethod,
      activityContext,
      purpose,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );
};

const verifyLoginChallengeToken = (token = "") => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.type !== "login_challenge") {
    throw new Error("Invalid login challenge token.");
  }

  return payload;
};

const sendLoginOtp = async ({ email, purpose }) => {
  const normalizedEmailAddress = normalizeEmail(email);
  const recentOtp = await OTP.findOne({
    email: normalizedEmailAddress,
    purpose,
  }).sort({ createdAt: -1 });

  if (recentOtp?.createdAt) {
    const secondsSinceLastOtp = Math.floor(
      (Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000
    );
    if (secondsSinceLastOtp < LOGIN_OTP_RESEND_SECONDS) {
      return {
        allowed: false,
        retryAfterSeconds: LOGIN_OTP_RESEND_SECONDS - secondsSinceLastOtp,
      };
    }
  }

  await OTP.deleteMany({ email: normalizedEmailAddress, purpose });

  const otpCode = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = await bcrypt.hash(otpCode, 10);
  await OTP.create({
    email: normalizedEmailAddress,
    hashedOtp,
    purpose,
  });

  const text = `Your login verification OTP is ${otpCode}. It expires in 5 minutes.`;

  if (hasMailConfig()) {
    await sendEmail({
      to: normalizedEmailAddress,
      subject: "OTP for Login Verification",
      text,
    });
  } else {
    console.log(`[LOGIN OTP SIMULATION] To ${normalizedEmailAddress}: ${text}`);
  }

  return {
    allowed: true,
    retryAfterSeconds: LOGIN_OTP_RESEND_SECONDS,
    expiresInSeconds: LOGIN_OTP_EXPIRY_SECONDS,
  };
};

const createLoginChallenge = async ({
  user,
  loginMethod,
  activityContext,
}) => {
  if (!user.email) {
    return {
      ok: false,
      status: 400,
      body: {
        error:
          "Chrome login requires a registered email address for OTP verification.",
      },
    };
  }

  const purpose = `${LOGIN_OTP_PURPOSE_PREFIX}_${crypto.randomBytes(12).toString("hex")}`;
  const otpSendResult = await sendLoginOtp({ email: user.email, purpose });

  if (!otpSendResult.allowed) {
    return {
      ok: false,
      status: 429,
      body: {
        error: `Please wait ${otpSendResult.retryAfterSeconds} seconds before requesting a new OTP.`,
      },
    };
  }

  return {
    ok: true,
    status: 202,
    body: {
      requiresOtp: true,
      pendingToken: createLoginChallengeToken({
        user,
        email: user.email,
        loginMethod,
        activityContext,
        purpose,
      }),
      message: "OTP sent to your registered email.",
      expiresInSeconds: LOGIN_OTP_EXPIRY_SECONDS,
      resendAfterSeconds: LOGIN_OTP_RESEND_SECONDS,
    },
  };
};

const saveLoginActivity = async ({ userId = null, loginStatus, loginMethod, context }) => {
  try {
    await LoginActivity.create({
      userId,
      loginStatus,
      loginMethod,
      browser: context.browser || "",
      browserVersion: context.browserVersion || "",
      operatingSystem: context.operatingSystem || "",
      deviceType: context.deviceType || "Unknown",
      ipAddress: context.ipAddress || "",
      userAgent: context.userAgent || "",
      country: context.country || "",
      city: context.city || "",
    });
  } catch (error) {
    console.error("Failed to save login activity:", error);
  }
};

module.exports = {
  LOGIN_OTP_RESEND_SECONDS,
  LOGIN_OTP_EXPIRY_SECONDS,
  createLoginChallenge,
  getLoginContext,
  getMobileRestrictionError,
  isChromeBrowser,
  saveLoginActivity,
  sendLoginOtp,
  verifyLoginChallengeToken,
};
