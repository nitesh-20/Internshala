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

// Real Nodemailer transport (uses Gmail credentials from .env)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Request OTP for Language switch or Payment
router.post('/request-otp', otpRateLimiter, async (req, res) => {
    try {
        const { email, languageCode, purpose = 'LANGUAGE_CHANGE' } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        // Check cooldown (60 seconds)
        const recentOtp = await OTP.findOne({ email, purpose }).sort({ createdAt: -1 });
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
            purpose
        });

        // Create a real SMTP transporter using Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your real Gmail address
                pass: process.env.EMAIL_PASS  // Your 16-digit App Password
            }
        });

        try {
            let subject = 'OTP for Security Verification';
            let text = `Your OTP is ${otpCode}. It expires in 5 minutes.`;
            
            if (purpose === 'LANGUAGE_CHANGE') {
                subject = 'OTP for Language Change';
                text = `Your OTP to switch language to ${languageCode ? languageCode.toUpperCase() : ''} is ${otpCode}. It expires in 5 minutes.`;
            } else if (purpose === 'RESUME_PAYMENT') {
                subject = 'OTP for Premium Resume Payment';
                text = `Your OTP to proceed with the premium resume payment (₹50) is ${otpCode}. It expires in 5 minutes.`;
            }

            await transporter.sendMail({
                from: `"Internshala OTP" <${process.env.EMAIL_USER}>`,
                to: email, // This sends to the user's real email!
                subject,
                text
            });
            console.log("Real Email sent successfully to", email);
            res.json({ message: "OTP sent successfully to " + email, dev_otp: otpCode });
        } catch (emailError) {
            console.error("Real Email failed to send. Check your .env credentials!", emailError);
            res.status(500).json({ error: "Failed to send real email. Please configure EMAIL_USER and EMAIL_PASS in your .env file." });
        }
    } catch (error) {
        console.error("OTP Send Error:", error);
        res.status(500).json({ error: "Server error sending OTP" });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp, languageCode, purpose = 'LANGUAGE_CHANGE' } = req.body;
        if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

        // Get latest OTP for this email and purpose
        const validOtp = await OTP.findOne({ email, purpose }).sort({ createdAt: -1 });
        
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

        res.json({ message: `OTP verified successfully.` });
    } catch (error) {
        console.error("OTP Verify Error:", error);
        res.status(500).json({ error: "Server error verifying OTP" });
    }
});

module.exports = router;
