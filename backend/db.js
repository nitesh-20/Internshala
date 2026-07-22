const mongoose = require("mongoose");
require('dotenv').config();
const database = process.env.DATABASE_URL;
const url = database;

module.exports.connect = () => {
  if (!url) {
    console.error("Database connection error: DATABASE_URL environment variable is missing.");
    return;
  }
  mongoose.connect(url)
    .then(() => console.log("Database is connected"))
    .catch((err) => console.error("Database connection error:", err));
};