const nodemailer = require("nodemailer");

const hasMailConfig = () =>
  Boolean(process.env.EMAIL_USER) && Boolean(process.env.EMAIL_PASS);

const getTransporter = () => {
  if (!hasMailConfig()) {
    throw new Error("Email service is not configured.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, text }) => {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: `"Internshala Auth" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

module.exports = {
  hasMailConfig,
  sendEmail,
};
