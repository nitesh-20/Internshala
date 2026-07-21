const express = require("express");
const router = express.Router();
const admin = require("./admin");
const intern = require("./internship");
const job = require("./job");
const application=require("./application")
const resume = require("./resume");
const auth = require("./auth");
const community = require("./community");

router.use("/admin", admin);
router.use("/auth", auth);
router.use("/community", community);
router.use("/internship", intern);
router.use("/job", job);
router.use("/application", application);
router.use("/resume", resume);

module.exports = router;
