const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Subscription = require("../Model/Subscription");
const Payment = require("../Model/Payment");
const User = require("../Model/User");
const { sendHtmlEmail } = require("../utils/mailer");
const { requireAuth } = require("../middleware/auth");

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const getRazorpayClient = () => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are missing.");
  }
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
};

const PLANS = {
  Free: { price: 0, limit: 1 },
  Bronze: { price: 100, limit: 3 },
  Silver: { price: 300, limit: 5 },
  Gold: { price: 1000, limit: -1 }, // -1 means unlimited
};

// Internal function to downgrade to free if expired
const ensureValidSubscription = async (userId) => {
  let sub = await Subscription.findOne({ userId });
  if (!sub) {
    sub = await Subscription.create({
      userId,
      plan: "Free",
      amount: 0,
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Far future for free
      applicationLimit: PLANS.Free.limit,
      applicationsUsed: 0,
      status: "active",
    });
  } else if (sub.plan !== "Free" && sub.expiryDate && new Date() > sub.expiryDate) {
    sub.plan = "Free";
    sub.amount = 0;
    sub.startDate = new Date();
    sub.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    sub.applicationLimit = PLANS.Free.limit;
    sub.applicationsUsed = 0;
    sub.status = "active";
    await sub.save();
  }
  return sub;
};

router.get("/plans", (req, res) => {
  res.json(PLANS);
});

router.get("/current", requireAuth, async (req, res) => {
  try {
    const sub = await ensureValidSubscription(req.authUser._id);
    res.json(sub);
  } catch (error) {
    console.error("Fetch Subscription Error:", error);
    res.status(500).json({ error: "Failed to fetch subscription." });
  }
});

router.get("/history", requireAuth, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ userId: req.authUser._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ userId: req.authUser._id }),
    ]);

    res.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasMore: skip + payments.length < total,
      },
    });
  } catch (error) {
    console.error("Fetch Payment History Error:", error);
    res.status(500).json({ error: "Failed to fetch payment history." });
  }
});

router.post("/create-order", requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan] || plan === "Free") {
      return res.status(400).json({ error: "Invalid plan selected." });
    }

    // Check IST time (Temporarily disabled for testing)
    // const nowIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    // const istDate = new Date(nowIST);
    // const hours = istDate.getHours();

    // if (hours < 10 || hours >= 11) {
    //   return res.status(403).json({ error: "Payments are allowed only between 10:00 AM and 11:00 AM IST." });
    // }

    const razorpay = getRazorpayClient();
    const options = {
      amount: PLANS[plan].price * 100, // in paise
      currency: "INR",
      receipt: `sub_${req.authUser._id.toString().slice(-6)}_${Date.now()}`,
      notes: {
        userId: req.authUser._id.toString(),
        plan,
      },
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Create Razorpay Order Error:", error);
    res.status(500).json({ error: "Unable to create Razorpay order." });
  }
});

router.post("/verify-payment", requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return res.status(400).json({ error: "Missing payment verification details" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      // Record failed payment
      await Payment.create({
        userId: req.authUser._id,
        plan,
        amount: PLANS[plan].price,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        transactionStatus: "failed",
      });
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Check if already processed
    const existingPayment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, transactionStatus: "success" });
    if (existingPayment) {
      return res.status(400).json({ error: "Payment already processed." });
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const paidAt = new Date();
    
    // Save Payment
    const paymentRecord = await Payment.create({
      userId: req.authUser._id,
      plan,
      amount: PLANS[plan].price,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      transactionStatus: "success",
      invoiceNumber,
      paidAt,
    });

    // Update Subscription
    let sub = await Subscription.findOne({ userId: req.authUser._id });
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // +30 days
    
    if (sub) {
      sub.plan = plan;
      sub.amount = PLANS[plan].price;
      sub.startDate = new Date();
      sub.expiryDate = expiryDate;
      sub.applicationLimit = PLANS[plan].limit;
      sub.applicationsUsed = 0; // Reset
      sub.status = "active";
      await sub.save();
    } else {
      sub = await Subscription.create({
        userId: req.authUser._id,
        plan,
        amount: PLANS[plan].price,
        startDate: new Date(),
        expiryDate,
        applicationLimit: PLANS[plan].limit,
        applicationsUsed: 0,
        status: "active",
      });
    }

    // Send Invoice Email
    const user = req.authUser;
    if (user.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">Subscription Invoice</h2>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Thank you for upgrading to the <strong>${plan} Plan</strong>. Here are your payment details:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Invoice Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${invoiceNumber}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Plan:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${plan}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Amount Paid:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">₹${PLANS[plan].price}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Transaction ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${razorpay_payment_id}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Payment Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${paidAt.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Activation Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${paidAt.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Expiry Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${expiryDate.toLocaleString()}</td></tr>
          </table>
          <p style="margin-top: 20px; color: #475569;">Your monthly application count has been reset. You can now apply for ${PLANS[plan].limit === -1 ? "unlimited" : PLANS[plan].limit} internships.</p>
        </div>
      `;
      try {
        await sendHtmlEmail({
          to: user.email,
          subject: `Invoice: InternArea ${plan} Plan Subscription`,
          html: emailHtml,
        });
      } catch (err) {
        console.error("Failed to send invoice email:", err);
      }
    }

    res.json({ message: "Payment verified successfully", subscription: sub, payment: paymentRecord });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ error: "Failed to verify payment." });
  }
});

module.exports = { router, ensureValidSubscription };
