const express = require('express');
const router = express.Router();
const OTP = require('../Model/OTP');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

// Rate limiting for OTP requests (max 3 requests per 5 minutes per IP)
const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { error: "Too many OTP requests from this IP, please try again after 5 minutes" }
});

// Mock Nodemailer transport (for dev purposes, ideally use real credentials from .env)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASS || 'ethereal_password'
    }
});

// Request OTP for Language switch
router.post('/request-otp', otpRateLimiter, async (req, res) => {
    try {
        const { email, languageCode } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });
        if (!languageCode) return res.status(400).json({ error: "Language code is required" });

        // Check cooldown (60 seconds)
        const recentOtp = await OTP.findOne({ email, purpose: 'LANGUAGE_CHANGE' }).sort({ createdAt: -1 });
        if (recentOtp && recentOtp.createdAt) {
            const timeSinceLastOtp = (Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000;
            if (timeSinceLastOtp < 60) {
                return res.status(429).json({ error: `Please wait ${Math.ceil(60 - timeSinceLastOtp)} seconds before requesting a new OTP.` });
            }
        }

        const otpCode = crypto.randomInt(100000, 999999).toString();
        const hashedOtp = await bcrypt.hash(otpCode, 10);
        
        await OTP.create({
            email,
            hashedOtp,
            purpose: 'LANGUAGE_CHANGE'
        });

        // Send email
        await transporter.sendMail({
            from: '"Internshala Security" <security@internshala.com>',
            to: email,
            subject: 'OTP for Language Change',
            text: `Your OTP to switch language to ${languageCode.toUpperCase()} is ${otpCode}. It expires in 5 minutes.`
        });

        // For local development without real email, return the OTP in response (REMOVE IN PRODUCTION)
        res.json({ message: "OTP sent successfully to " + email, dev_otp: otpCode });
    } catch (error) {
        console.error("OTP Send Error:", error);
        res.status(500).json({ error: "Server error sending OTP" });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp, languageCode } = req.body;
        if (!email || !otp || !languageCode) return res.status(400).json({ error: "Email, OTP and languageCode are required" });

        // Get latest OTP for this email
        const validOtp = await OTP.findOne({ email, purpose: 'LANGUAGE_CHANGE' }).sort({ createdAt: -1 });
        
        if (!validOtp) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        if (validOtp.attempts >= 5) {
            await OTP.deleteOne({ _id: validOtp._id });
            return res.status(429).json({ error: "Maximum attempts reached. Please request a new OTP." });
        }

        const isMatch = await bcrypt.compare(otp, validOtp.hashedOtp);
        if (!isMatch) {
            validOtp.attempts += 1;
            await validOtp.save();
            return res.status(400).json({ error: `Invalid OTP. ${5 - validOtp.attempts} attempts remaining.` });
        }

        // Delete the OTP after successful verification
        await OTP.deleteOne({ _id: validOtp._id });

        res.json({ message: `OTP verified successfully. Language changed to ${languageCode.toUpperCase()}.` });
    } catch (error) {
        console.error("OTP Verify Error:", error);
        res.status(500).json({ error: "Server error verifying OTP" });
    }
});

module.exports = router;
