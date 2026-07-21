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

// Helper to draw text if it exists
function drawText(doc, text, options = {}) {
    if (text && String(text).trim() !== "") {
        doc.text(text, options);
    }
}

// Helper to draw section header
function drawSectionHeader(doc, title) {
    doc.moveDown(1);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563EB').text(title.toUpperCase());
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).strokeColor('#E5E7EB').stroke();
    doc.moveDown(0.5);
    doc.fillColor('#111827');
}

// Draft save endpoint
router.post('/draft', async (req, res) => {
    try {
        const { email, resumeData } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        let resumeRecord = await Resume.findOne({ email });
        if (resumeRecord) {
            // Update draft fields but don't touch payment status
            Object.assign(resumeRecord, resumeData);
            await resumeRecord.save();
        } else {
            resumeRecord = await Resume.create({ email, ...resumeData });
        }
        res.json({ message: "Draft saved successfully", resume: resumeRecord });
    } catch (error) {
        console.error("Error saving draft:", error);
        res.status(500).json({ error: "Failed to save draft" });
    }
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

        // Generate PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = `resume_${Date.now()}_${email.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
        
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const filepath = path.join(uploadsDir, filename);
        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        // Build PDF Content (ATS Friendly minimalist design)
        // Personal Info
        const pInfo = resumeData.personalInfo || {};
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#111827').text(pInfo.fullName || "Name Not Provided", { align: 'center' });
        doc.moveDown(0.2);
        
        const contactDetails = [pInfo.email, pInfo.phone, pInfo.city ? `${pInfo.city}, ${pInfo.country}` : '']
            .filter(Boolean)
            .join(' | ');
        doc.fontSize(10).font('Helvetica').fillColor('#4B5563').text(contactDetails, { align: 'center' });
        
        const socialLinks = resumeData.socialLinks || {};
        const linksArr = [socialLinks.linkedin, socialLinks.github, socialLinks.portfolio, socialLinks.website]
            .filter(Boolean);
        if (linksArr.length > 0) {
            doc.moveDown(0.2);
            doc.text(linksArr.join(' | '), { align: 'center', link: linksArr[0] });
        }
        
        doc.moveDown(1);
        doc.fillColor('#111827');

        // Summary
        if (resumeData.summary) {
            drawSectionHeader(doc, 'Professional Summary');
            doc.fontSize(10).font('Helvetica').text(resumeData.summary, { align: 'justify' });
        }

        // Education
        if (resumeData.education && resumeData.education.length > 0) {
            drawSectionHeader(doc, 'Education');
            resumeData.education.forEach(edu => {
                doc.fontSize(11).font('Helvetica-Bold').text(edu.degree || '');
                doc.fontSize(10).font('Helvetica-Oblique').text(edu.college || '');
                doc.fontSize(10).font('Helvetica').fillColor('#6B7280').text(`${edu.startYear} - ${edu.endYear} | Score: ${edu.score}`);
                doc.fillColor('#111827').moveDown(0.5);
            });
        }

        // Experience
        if (resumeData.experience && resumeData.experience.length > 0) {
            drawSectionHeader(doc, 'Work Experience');
            resumeData.experience.forEach(exp => {
                doc.fontSize(11).font('Helvetica-Bold').text(exp.role || '');
                doc.fontSize(10).font('Helvetica-Oblique').text(exp.company || '');
                doc.fontSize(10).font('Helvetica').fillColor('#6B7280').text(`${exp.startDate} - ${exp.endDate}`);
                doc.fillColor('#111827').moveDown(0.2);
                doc.fontSize(10).font('Helvetica').text(exp.description || '', { align: 'justify' });
                doc.moveDown(0.5);
            });
        }

        // Projects
        if (resumeData.projects && resumeData.projects.length > 0) {
            drawSectionHeader(doc, 'Projects');
            resumeData.projects.forEach(proj => {
                doc.fontSize(11).font('Helvetica-Bold').text(proj.name || '', { continued: proj.technologies ? true : false });
                if (proj.technologies) {
                    doc.font('Helvetica').text(` | ${proj.technologies}`);
                }
                const projLinks = [proj.githubLink, proj.liveLink].filter(Boolean).join(' | ');
                if (projLinks) {
                    doc.fontSize(9).fillColor('#2563EB').text(projLinks);
                }
                doc.fillColor('#111827').moveDown(0.2);
                doc.fontSize(10).font('Helvetica').text(proj.description || '', { align: 'justify' });
                doc.moveDown(0.5);
            });
        }

        // Skills & Languages (2 Columns approach, or just lists)
        if ((resumeData.skills && resumeData.skills.length > 0) || (resumeData.languages && resumeData.languages.length > 0)) {
            doc.moveDown(0.5);
            
            if (resumeData.skills && resumeData.skills.length > 0) {
                drawSectionHeader(doc, 'Skills');
                doc.fontSize(10).font('Helvetica').text(resumeData.skills.join(', '));
            }
            if (resumeData.languages && resumeData.languages.length > 0) {
                drawSectionHeader(doc, 'Languages');
                doc.fontSize(10).font('Helvetica').text(resumeData.languages.join(', '));
            }
        }

        // Certifications
        if (resumeData.certifications && resumeData.certifications.length > 0) {
            drawSectionHeader(doc, 'Certifications');
            resumeData.certifications.forEach(cert => {
                doc.fontSize(10).font('Helvetica-Bold').text(cert.name || '', { continued: true });
                doc.font('Helvetica').text(` - ${cert.organization || ''} (${cert.issueDate || ''})`);
                if (cert.credentialLink) {
                    doc.fontSize(9).fillColor('#2563EB').text(cert.credentialLink);
                    doc.fillColor('#111827');
                }
            });
        }

        // Achievements
        if (resumeData.achievements && resumeData.achievements.length > 0) {
            drawSectionHeader(doc, 'Achievements');
            resumeData.achievements.forEach(ach => {
                doc.fontSize(10).font('Helvetica').text(`• ${ach}`);
            });
        }

        doc.end();

        // Wait for PDF to finish writing
        await new Promise((resolve) => writeStream.on('finish', resolve));

        const pdfUrl = `http://localhost:5001/uploads/${filename}`;

        // Save to Database
        let resumeRecord = await Resume.findOne({ email });
        if (resumeRecord) {
            // Update all fields
            Object.assign(resumeRecord, resumeData);
            resumeRecord.pdfUrl = pdfUrl;
            resumeRecord.isPaid = true;
            resumeRecord.paymentStatus = 'success';
            resumeRecord.razorpayOrderId = razorpay_order_id;
            resumeRecord.razorpayPaymentId = razorpay_payment_id;
            await resumeRecord.save();
        } else {
            resumeRecord = await Resume.create({
                email,
                ...resumeData,
                pdfUrl,
                isPaid: true,
                paymentStatus: 'success',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id
            });
        }

        res.json({ message: "Resume generated successfully", pdfUrl, resume: resumeRecord });
    } catch (error) {
        console.error("Error generating resume:", error);
        res.status(500).json({ error: "Failed to generate resume" });
    }
});

// Endpoint to fetch user's resume (draft or paid)
router.get('/:email', async (req, res) => {
    try {
        const resumeRecord = await Resume.findOne({ email: req.params.email });
        if (!resumeRecord) {
            return res.status(404).json({ error: "Resume not found" });
        }
        res.json(resumeRecord);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch resume" });
    }
});

module.exports = router;
