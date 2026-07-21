const mongoose = require("mongoose");

const loginActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    browser: { type: String, default: "" },
    browserVersion: { type: String, default: "" },
    operatingSystem: { type: String, default: "" },
    deviceType: {
      type: String,
      enum: ["Desktop", "Laptop", "Mobile", "Tablet", "Unknown"],
      default: "Unknown",
    },
    ipAddress: { type: String, default: "" },
    loginMethod: {
      type: String,
      enum: ["Google", "Email/Password"],
      required: true,
    },
    loginStatus: {
      type: String,
      enum: ["Success", "Failed"],
      required: true,
    },
    userAgent: { type: String, default: "" },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("LoginActivity", loginActivitySchema);
