const express = require("express");
const router = express.Router();
const application = require("../Model/Application");
const { ensureValidSubscription } = require("./subscription");

router.post("/", async (req, res) => {
  try {
    const userId = req.body.user?.id || req.body.user?._id || req.body.user?.uid;
    if (userId) {
      const sub = await ensureValidSubscription(userId);
      if (sub.applicationLimit !== -1 && sub.applicationsUsed >= sub.applicationLimit) {
        return res.status(403).json({ error: "You have reached your monthly internship application limit. Please upgrade your plan." });
      }
      sub.applicationsUsed += 1;
      await sub.save();
    }

    const applicationipdata = new application({
    company: req.body.company,
    category: req.body.category,
    coverLetter: req.body.coverLetter,
    user: req.body.user,
    Application: req.body.Application,
    body: req.body.body,
  });
    await applicationipdata.save();
    res.status(200).send(applicationipdata);
  } catch (error) {
    console.error("Application Error:", error);
    res.status(500).json({ error: "internal server error" });
  }
});
router.get("/", async (req, res) => {
  try {
    const data = await application.find();
    res.json(data).status(200);
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "internal server error" });
  }
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await application.findById(id);
    if (!data) {
      res.status(404).json({ error: "application not found" });
    }
    res.json(data).status(200);
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "internal server error" });
  }
});
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  let status;
  if (action === "accepted") {
    status = "accepted";
  } else if (action === "rejected") {
    status = "rejected";
  } else {
    res.status(404).json({ error: "Invalid action" });
    return;
  }
  try {
    const updateapplication = await application.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!updateapplication) {
      res.status(404).json({ error: "Not able to update the application" });
      return;
    }
    res.status(200).json({ sucess: true, data: updateapplication });
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
});
module.exports = router;
