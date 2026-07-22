const mongoose = require('mongoose');
const Internship = require('./Model/Internship');
require('dotenv').config();

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

const roles = [
  { title: "Web Development Intern", category: "Web Development", skills: ["HTML", "CSS", "JavaScript", "React"] },
  { title: "Frontend Engineering Intern", category: "Frontend", skills: ["React", "TypeScript", "Tailwind CSS"] },
  { title: "Backend Developer Intern", category: "Backend", skills: ["Node.js", "Express", "MongoDB", "SQL"] },
  { title: "AI Research Intern", category: "AI", skills: ["Python", "TensorFlow", "PyTorch"] },
  { title: "Machine Learning Intern", category: "Machine Learning", skills: ["Python", "Scikit-Learn", "Pandas"] },
  { title: "Cyber Security Analyst Intern", category: "Cyber Security", skills: ["Linux", "Wireshark", "Network Security"] },
  { title: "Cloud Architect Intern", category: "Cloud", skills: ["AWS", "Docker", "Kubernetes"] },
  { title: "Digital Marketing Intern", category: "Marketing", skills: ["SEO", "Google Analytics", "Social Media"] },
  { title: "Financial Analyst Intern", category: "Finance", skills: ["Excel", "Financial Modeling", "Valuation"] },
  { title: "Business Development Intern", category: "Sales", skills: ["Communication", "Lead Generation", "CRM"] },
  { title: "UI/UX Design Intern", category: "UI UX", skills: ["Figma", "Wireframing", "Prototyping", "Adobe XD"] },
  { title: "Data Analyst Intern", category: "Data Science", skills: ["Python", "SQL", "Tableau", "Power BI"] },
  { title: "Associate Product Manager Intern", category: "Product Management", skills: ["Agile", "User Stories", "Roadmapping"] },
  { title: "Mobile App Developer Intern", category: "Mobile Development", skills: ["React Native", "Flutter", "Dart"] },
  { title: "Content Writing Intern", category: "Content Writing", skills: ["SEO Copywriting", "Content Strategy"] },
  { title: "Human Resources Intern", category: "Human Resources", skills: ["Recruiting", "Employee Engagement"] }
];

const locations = ["Bangalore, India", "Pune, India", "Hyderabad, India", "Mumbai, India", "Delhi NCR, India", "Chennai, India", "Remote"];
const perksList = [
  ["Certificate", "Letter of Recommendation", "Flexible Work Hours"],
  ["Certificate", "Flexible Work Hours", "Informal Dress Code"],
  ["Certificate", "Free Snacks & Beverages", "Letter of Recommendation"],
  ["Certificate", "Flexible Work Hours", "Mentorship Program", "PPO Option"],
  ["Certificate", "Cab Facility", "Free Meals", "PPO Option"]
];

const internships = [];

// Generate exactly 40 realistic internships
for (let i = 0; i < 40; i++) {
  const company = companies[i % companies.length];
  const role = roles[i % roles.length];
  const loc = locations[i % locations.length];
  const perks = perksList[i % perksList.length];
  const openings = (1 + (i % 5)).toString();
  const stipendVal = 10000 + (i % 7) * 5000 + (i % 3) * 2000;
  const duration = (2 + (i % 5)) + " Months";
  
  internships.push({
    title: `${company.name} ${role.title}`,
    company: company.name,
    location: loc,
    category: role.category,
    aboutCompany: `${company.name} is a leading ${company.industry} firm with a strong culture of innovation and excellence, rated ${company.rating}/5.0 by employees. We aim to build products that empower users worldwide.`,
    aboutInternship: `We are looking for a motivated and enthusiastic student to join our team as a ${role.title}. In this role, you will work on production code/assets, participate in daily standups, and be mentored by senior engineers and professionals in our dynamic work environment.`,
    whoCanApply: `Pre-final or final year students in relevant discipline. Strong analytical skills and familiarity with: ${role.skills.join(', ')}. Ability to dedicate at least 30-40 hours per week for the duration of the internship.`,
    perks: perks,
    numberOfOpening: openings,
    stipend: `₹${stipendVal.toLocaleString('en-IN')} /month`,
    startDate: new Date(Date.now() + (7 + i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    additionalInfo: i % 2 === 0 ? "Excellent performer has high chance of getting a Pre-Placement Offer (PPO)." : "This position offers opportunities to work directly with leadership teams."
  });
}

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  await Internship.deleteMany({});
  await Internship.insertMany(internships);
  console.log("Successfully seeded 40 internships!");
  process.exit(0);
}).catch(err => {
  console.error("Error seeding internships:", err);
  process.exit(1);
});
