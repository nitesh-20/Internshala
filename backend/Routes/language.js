const express = require('express');
const router = express.Router();
const OTP = require('../Model/OTP');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Mock Nodemailer transport (for dev purposes, ideally use real credentials from .env)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASS || 'ethereal_password'
    }
});

// Request OTP for French Language switch
router.post('/request-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        const otpCode = crypto.randomInt(100000, 999999).toString();
        
        await OTP.create({
            email,
            otp: otpCode,
            purpose: 'FRENCH_LANGUAGE'
        });

        // Send email
        await transporter.sendMail({
            from: '"Internshala Security" <security@internshala.com>',
            to: email,
            subject: 'OTP for Language Change',
            text: `Your OTP to switch language to French is ${otpCode}. It expires in 5 minutes.`
        });

        // For local development without real email, return the OTP in response (REMOVE IN PRODUCTION)
        res.json({ message: "OTP sent successfully to " + email, dev_otp: otpCode });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error sending OTP" });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

        const validOtp = await OTP.findOne({ email, otp, purpose: 'FRENCH_LANGUAGE' });
        if (!validOtp) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // Delete the OTP after successful verification
        await OTP.deleteOne({ _id: validOtp._id });

        res.json({ message: "OTP verified successfully. Language changed to French." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error verifying OTP" });
    }
});

module.exports = router;
