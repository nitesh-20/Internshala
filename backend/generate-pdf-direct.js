const mongoose = require('mongoose');
const Resume = require('./Model/Resume');
const PDFDocument = require('pdfkit');
require('dotenv').config();

function drawSectionHeader(doc, title) {
    doc.moveDown(1);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563EB').text(title.toUpperCase());
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).strokeColor('#E5E7EB').stroke();
    doc.moveDown(0.5);
    doc.fillColor('#111827');
}

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  const email = 'nsahu6156@gmail.com';
  let resumeRecord = await Resume.findOne({ email });
  if (!resumeRecord) {
    console.log('No resume found');
    process.exit(1);
  }

  const resumeData = resumeRecord;

  // Generate PDF in memory
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  const pdfUrl = await new Promise((resolve, reject) => {
      doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          const base64Pdf = pdfBuffer.toString('base64');
          resolve(`data:application/pdf;base64,${base64Pdf}`);
      });
      doc.on('error', reject);

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
  });

  resumeRecord.pdfUrl = pdfUrl;
  resumeRecord.isPaid = true;
  await resumeRecord.save();
  console.log('Successfully generated and saved PDF for', email);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
