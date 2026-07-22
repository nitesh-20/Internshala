const mongoose = require('mongoose');
const Resume = require('./Model/Resume');
require('dotenv').config();

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  const email = 'nsahu6156@gmail.com';
  let resume = await Resume.findOne({ email });
  if (resume) {
    resume.isPaid = true;
    resume.paymentStatus = 'success';
    await resume.save();
    console.log('Successfully unlocked resume for', email);
  } else {
    console.log('No resume found for', email);
  }
  process.exit(0);
});
