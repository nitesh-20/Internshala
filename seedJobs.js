const mongoose = require("mongoose");
const Job = require("./backend/Model/Job");
require("dotenv").config({ path: "./backend/.env" });

const companies = [
  { name: "Google", industry: "Technology", rating: 4.8 },
  { name: "Microsoft", industry: "Technology", rating: 4.7 },
  { name: "Amazon", industry: "E-Commerce", rating: 4.6 },
  { name: "Adobe", industry: "Software", rating: 4.5 },
  { name: "Paytm", industry: "Fintech", rating: 4.1 },
  { name: "PhonePe", industry: "Fintech", rating: 4.3 },
  { name: "Meesho", industry: "E-Commerce", rating: 4.2 },
  { name: "Razorpay", industry: "Fintech", rating: 4.4 },
  { name: "Zoho", industry: "SaaS", rating: 4.5 },
  { name: "Freshworks", industry: "SaaS", rating: 4.4 },
  { name: "Swiggy", industry: "Foodtech", rating: 4.2 },
  { name: "Zomato", industry: "Foodtech", rating: 4.3 },
  { name: "Flipkart", industry: "E-Commerce", rating: 4.2 },
  { name: "Ola", industry: "Mobility", rating: 4.0 },
  { name: "Cred", industry: "Fintech", rating: 4.4 },
  { name: "Nykaa", industry: "E-Commerce", rating: 4.1 },
  { name: "Zerodha", industry: "Fintech", rating: 4.6 },
  { name: "Jio", industry: "Telecom", rating: 4.2 },
  { name: "Airtel", industry: "Telecom", rating: 4.1 },
  { name: "HDFC Bank", industry: "Banking", rating: 4.3 }
];

const jobRoles = [
  { title: "Senior Full Stack Engineer", category: "Engineering", experience: "5+ years", skills: ["React", "Node.js", "AWS", "MongoDB"] },
  { title: "Frontend Developer", category: "Engineering", experience: "2+ years", skills: ["React", "TypeScript", "Tailwind CSS"] },
  { title: "Data Scientist", category: "Data Science", experience: "4+ years", skills: ["Python", "SQL", "Machine Learning models"] },
  { title: "Product Designer", category: "Design", experience: "3+ years", skills: ["Figma", "UI/UX", "User Research"] },
  { title: "Backend Engineer", category: "Engineering", experience: "3+ years", skills: ["Java", "Spring Boot", "MySQL", "AWS"] },
  { title: "AI/ML Engineer", category: "Engineering", experience: "3+ years", skills: ["Python", "TensorFlow", "Deep Learning"] },
  { title: "DevOps Engineer", category: "Engineering", experience: "4+ years", skills: ["AWS", "Docker", "Kubernetes", "CI/CD"] },
  { title: "Marketing Manager", category: "Marketing", experience: "5+ years", skills: ["Growth Marketing", "Google Analytics", "Brand Strategy"] },
  { title: "Financial Analyst", category: "Finance", experience: "2+ years", skills: ["Financial Modeling", "Excel", "Accounting"] },
  { title: "Sales Executive", category: "Sales", experience: "1+ years", skills: ["Lead Generation", "Communication", "Negotiation"] },
  { title: "Cyber Security Specialist", category: "Engineering", experience: "4+ years", skills: ["Information Security", "Network Security", "Penetration Testing"] },
  { title: "Mobile Developer (Flutter)", category: "Engineering", experience: "3+ years", skills: ["Flutter", "Dart", "iOS", "Android"] }
];

const locations = ["Bangalore, India", "Pune, India", "Hyderabad, India", "Mumbai, India", "Delhi NCR, India", "Remote"];
const perksList = [
  ["Health Insurance", "Flexible Hours", "Gym Allowance"],
  ["Remote first", "Home office stipend", "Wellness benefits"],
  ["Flexible hours", "Comprehensive health", "Equity Options"],
  ["Travel credits", "Health benefits", "Equity"],
  ["Unlimited PTO", "Top of market salary", "Free lunch", "Internet Stipend"]
];

const jobs = [];

// Generate exactly 30 realistic jobs
for (let i = 0; i < 30; i++) {
  const company = companies[i % companies.length];
  const role = jobRoles[i % jobRoles.length];
  const loc = locations[i % locations.length];
  const perks = perksList[i % perksList.length];
  const ctcVal = 10 + (i % 5) * 5 + (i % 3) * 2;
  
  jobs.push({
    title: `${company.name} ${role.title}`,
    company: company.name,
    location: loc,
    Experience: role.experience,
    category: role.category,
    aboutCompany: `${company.name} is a leading global player in ${company.industry}, committed to shaping the future through technology and customer empathy. Rated ${company.rating}/5.0 by our employees.`,
    aboutJob: `We are looking for a ${role.title} to join our world-class team. You will lead key initiatives, build high-performance scalable systems, and collaborate cross-functionally to deliver amazing user experiences.`,
    whoCanApply: `Candidates with ${role.experience} experience. Expert knowledge of ${role.skills.join(', ')}. Strong problem solving and communication skills are required.`,
    perks: perks,
    AdditionalInfo: i % 2 === 0 ? "Hybrid work setup with 2 days on-site." : "100% remote job opportunity.",
    CTC: `₹${ctcVal} - ${ctcVal + 4} LPA`,
    StartDate: new Date(Date.now() + (10 + i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in env variables.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    await Job.deleteMany({});
    await Job.insertMany(jobs);
    console.log("Seeding 30 jobs complete.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed jobs", err);
    process.exit(1);
  }
}

seed();
