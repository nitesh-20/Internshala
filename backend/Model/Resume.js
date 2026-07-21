const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  email: { type: String, required: true },
  
  // Section 1: Personal Info
  personalInfo: {
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    pincode: { type: String, default: "" },
  },

  // Section 2: Summary
  summary: { type: String, default: "" },

  // Section 3: Education
  education: [{
    degree: String,
    college: String,
    branch: String,
    startYear: String,
    endYear: String,
    score: String
  }],

  // Section 4: Skills
  skills: [{ type: String }],

  // Section 5: Experience
  experience: [{
    company: String,
    role: String,
    startDate: String,
    endDate: String,
    description: String
  }],

  // Section 6: Projects
  projects: [{
    name: String,
    technologies: String,
    description: String,
    githubLink: String,
    liveLink: String
  }],

  // Section 7: Certifications
  certifications: [{
    name: String,
    organization: String,
    issueDate: String,
    credentialLink: String
  }],

  // Section 8: Achievements
  achievements: [{ type: String }],

  // Section 9: Languages
  languages: [{ type: String }],

  // Section 10: Social Links
  socialLinks: {
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    website: { type: String, default: "" }
  },

  pdfUrl: { type: String, default: "" },
  isPaid: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['draft', 'success'], default: 'draft' },
  razorpayOrderId: { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
resumeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Resume", resumeSchema);
