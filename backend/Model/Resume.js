const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  email: { type: String, required: true }, // Linked to Firebase user email
  name: { type: String, required: true },
  qualifications: { type: String },
  experience: { type: String },
  personalInformation: { type: String },
  photoUrl: { type: String }, // Can be an uploaded image URL
  pdfUrl: { type: String }, // The generated PDF URL
  isPaid: { type: Boolean, default: false }, // Will be set to true after Razorpay payment
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Resume", resumeSchema);
