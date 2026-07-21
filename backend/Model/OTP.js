const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: { type: String, required: true }, // e.g., 'FRENCH_LANGUAGE', 'PAYMENT', 'LOGIN'
  createdAt: { type: Date, default: Date.now, expires: 300 } // OTP expires in 5 minutes
});

module.exports = mongoose.model('OTP', otpSchema);
