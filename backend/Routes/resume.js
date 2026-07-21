const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Resume = require('../Model/Resume');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// Endpoint to create a Razorpay order
router.post('/create-order', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        const options = {
            amount: 50 * 100, // ₹50 in paise
            currency: "INR",
            receipt: "receipt_" + Date.now()
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
});

// Endpoint to verify Razorpay payment and generate PDF
router.post('/verify-and-generate', async (req, res) => {
    try {
        const { email, razorpay_order_id, razorpay_payment_id, razorpay_signature, resumeData } = req.body;

        // Verify Signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ error: "Invalid payment signature" });
        }

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        const filename = `resume_${Date.now()}_${email.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
        const filepath = path.join(__dirname, '../uploads', filename);

        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        // Build PDF Content
        doc.fontSize(25).font('Helvetica-Bold').text(resumeData.name, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(email, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text("Personal Information");
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(resumeData.personalInformation);
        doc.moveDown(1);

        doc.fontSize(16).font('Helvetica-Bold').text("Qualifications");
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(resumeData.qualifications);
        doc.moveDown(1);

        doc.fontSize(16).font('Helvetica-Bold').text("Experience");
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(resumeData.experience);

        doc.end();

        // Wait for PDF to finish writing
        await new Promise((resolve) => writeStream.on('finish', resolve));

        const pdfUrl = `http://localhost:5001/uploads/${filename}`;

        // Save to Database
        let resumeRecord = await Resume.findOne({ email });
        if (resumeRecord) {
            resumeRecord.name = resumeData.name;
            resumeRecord.qualifications = resumeData.qualifications;
            resumeRecord.experience = resumeData.experience;
            resumeRecord.personalInformation = resumeData.personalInformation;
            resumeRecord.pdfUrl = pdfUrl;
            resumeRecord.isPaid = true;
            resumeRecord.razorpayOrderId = razorpay_order_id;
            resumeRecord.razorpayPaymentId = razorpay_payment_id;
            await resumeRecord.save();
        } else {
            resumeRecord = await Resume.create({
                email,
                ...resumeData,
                pdfUrl,
                isPaid: true,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id
            });
        }

        res.json({ message: "Resume generated successfully", pdfUrl });
    } catch (error) {
        console.error("Error generating resume:", error);
        res.status(500).json({ error: "Failed to generate resume" });
    }
});

// Endpoint to fetch user's resume
router.get('/:email', async (req, res) => {
    try {
        const resumeRecord = await Resume.findOne({ email: req.params.email, isPaid: true });
        if (!resumeRecord) {
            return res.status(404).json({ error: "Resume not found" });
        }
        res.json(resumeRecord);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch resume" });
    }
});

module.exports = router;
