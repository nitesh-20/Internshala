const mongoose = require('mongoose');
const Internship = require('./Model/Internship');
require('dotenv').config();

const internships = [
  {
    title: "Software Engineering Intern",
    company: "Google",
    location: "Bangalore, India",
    category: "Engineering",
    aboutCompany: "Google's mission is to organize the world's information and make it universally accessible and useful.",
    aboutInternship: "We are looking for Software Engineering interns to join our product teams. You will work on real-world projects, write production code, and collaborate with experienced engineers.",
    whoCanApply: "Currently pursuing a Bachelor's, Master's, or PhD in Computer Science or a related technical field. Experience in Java, C++, Python, or Go.",
    perks: ["Free Food", "Cab Facility", "Certificate", "Flexible Hours"],
    numberOfOpening: "5",
    stipend: "₹1,00,000 /month",
    startDate: "2025-09-01",
    additionalInfo: "This is a 6-month internship with a possibility of PPO (Pre-Placement Offer)."
  },
  {
    title: "UI/UX Design Intern",
    company: "Figma",
    location: "Remote",
    category: "Design",
    aboutCompany: "Figma is a leading collaborative design tool for teams.",
    aboutInternship: "Join our design team to help build the future of collaborative design. You will work closely with senior designers, conduct user research, and create wireframes and high-fidelity mockups.",
    whoCanApply: "Students studying Design, HCI, or related fields. Strong portfolio showcasing UI/UX design projects.",
    perks: ["Remote Stipend", "Flexible Hours", "Mentorship", "Certificate"],
    numberOfOpening: "2",
    stipend: "₹50,000 /month",
    startDate: "2025-08-15",
    additionalInfo: "Fully remote role."
  },
  {
    title: "Data Analyst Intern",
    company: "Microsoft",
    location: "Hyderabad, India",
    category: "Data Science",
    aboutCompany: "Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge.",
    aboutInternship: "As a Data Analyst Intern, you will work on extracting, cleaning, and analyzing data to provide insights and business recommendations for Microsoft products.",
    whoCanApply: "Knowledge of SQL, Python, Power BI/Tableau. Strong analytical skills.",
    perks: ["Certificate", "Letter of Recommendation", "Free Meals"],
    numberOfOpening: "3",
    stipend: "₹80,000 /month",
    startDate: "2025-09-15",
    additionalInfo: "Hybrid work model."
  }
];

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  await Internship.deleteMany({});
  await Internship.insertMany(internships);
  console.log("Successfully seeded internships!");
  process.exit(0);
}).catch(err => {
  console.error("Error seeding internships:", err);
  process.exit(1);
});
