const mongoose = require("mongoose");
const Job = require("./backend/Model/Job");
require("dotenv").config({ path: "./backend/.env" });

const jobs = [
  {
    title: "Full Stack Engineer",
    company: "Google",
    location: "Mountain View, CA",
    Experience: "3+ years",
    category: "Engineering",
    aboutCompany: "Google is an American multinational technology company that focuses on search engine technology, online advertising, cloud computing, computer software, quantum computing, e-commerce, artificial intelligence, and consumer electronics.",
    aboutJob: "We are looking for a Full Stack Engineer to join our core team to build and scale consumer-facing products.",
    whoCanApply: "Candidates with strong experience in React, Node.js, and Cloud Infrastructure.",
    perks: ["Health Insurance", "Free Food", "Transport", "Stock Options"],
    AdditionalInfo: "Hybrid role.",
    CTC: "$150k - $200k",
    StartDate: "2025-08-01"
  },
  {
    title: "Frontend Developer",
    company: "Stripe",
    location: "Remote",
    Experience: "2+ years",
    category: "Engineering",
    aboutCompany: "Stripe is a financial infrastructure platform for the internet.",
    aboutJob: "Develop user-facing features using modern React and TypeScript.",
    whoCanApply: "Developers with a keen eye for design and performance.",
    perks: ["Remote first", "Home office stipend", "Wellness benefits"],
    AdditionalInfo: "Fully remote within US timezones.",
    CTC: "$130k - $160k",
    StartDate: "2025-07-15"
  },
  {
    title: "Data Scientist",
    company: "Spotify",
    location: "New York, NY",
    Experience: "4+ years",
    category: "Data Science",
    aboutCompany: "Spotify is a proprietary Swedish audio streaming and media services provider.",
    aboutJob: "Analyze user behavior to improve recommendation algorithms.",
    whoCanApply: "Experts in Python, SQL, and Machine Learning models.",
    perks: ["Flexible hours", "Concert tickets", "Comprehensive health"],
    AdditionalInfo: "On-site role.",
    CTC: "$140k - $170k",
    StartDate: "2025-09-01"
  },
  {
    title: "Product Designer",
    company: "Airbnb",
    location: "San Francisco, CA",
    Experience: "3+ years",
    category: "Design",
    aboutCompany: "Airbnb is an American company that operates an online marketplace for lodging, primarily homestays for vacation rentals.",
    aboutJob: "Design beautiful, intuitive interfaces that inspire travel.",
    whoCanApply: "Designers with a strong portfolio showcasing user-centric design.",
    perks: ["Travel credits", "Health benefits", "Equity"],
    AdditionalInfo: "Hybrid work model.",
    CTC: "$120k - $150k",
    StartDate: "2025-08-15"
  },
  {
    title: "Backend Engineer",
    company: "Netflix",
    location: "Los Gatos, CA",
    Experience: "5+ years",
    category: "Engineering",
    aboutCompany: "Netflix is a global streaming service offering a wide variety of award-winning TV shows, movies, anime, documentaries, and more.",
    aboutJob: "Build highly scalable microservices in Java and Go.",
    whoCanApply: "Senior engineers with experience in distributed systems.",
    perks: ["Unlimited PTO", "Top of market salary", "Free lunch"],
    AdditionalInfo: "Relocation assistance provided.",
    CTC: "$180k - $250k",
    StartDate: "2025-10-01"
  }
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in env variables.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    await Job.deleteMany({});
    await Job.insertMany(jobs);
    console.log("Seeding jobs complete.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed jobs", err);
    process.exit(1);
  }
}

seed();
