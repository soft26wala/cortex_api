import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { connectDB } from "../db/db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

let db;

// Connect DB only once
(async () => {
  db = await connectDB();
})();


// const createPaymentRouter = (db) => {
    // const router = express.Router();

    // Validate DB connection
    if (!db) {
        console.error("❌ Database connection not passed to payment router");
        return router; // Return empty router if DB is not available
    }

    // Razorpay Instance Setup
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // --- 1. Create Razorpay Order ---
    // Frontend se isse call karein jab user "Pay Now" par click kare
    router.post("/create-order", async (req, res) => {
        try {
            const { amount, userId, courseName } = req.body;
            
            if (!amount) return res.status(400).json({ error: "Amount is required" });

            const options = {
                amount: amount * 100, // Razorpay paise mein amount leta hai
                currency: "INR",
                receipt: `rcp_${Date.now()}`,
            };

            const order = await razorpay.orders.create(options);

            // DB mein initial entry (Status: PENDING)
            const query = `
                INSERT INTO payments (transaction_id, user_id, course_name, amount, payment_status)
                VALUES ($1, $2, $3, $4, $5)
            `;
            await db.query(query, [
                order.id, // Razorpay Order ID as Transaction ID
                userId,
                courseName,
                amount,
                "PENDING",
            ]);

            res.json(order);
        } catch (error) {
            console.error("Order Creation Error:", error);
            res.status(500).json({ error: "Failed to create order" });
        }
    });

    // --- 2. Verify Payment Signature (Frontend Callback) ---
    // Jab Razorpay ka Popup successful payment dikhaye, tab frontend se isse call karein
    router.post("/verify-payment", async (req, res) => {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            if (expectedSignature === razorpay_signature) {
                // Update DB to SUCCESS
                await db.query(
                    "UPDATE payments SET payment_status = 'SUCCESS' WHERE transaction_id = $1",
                    [razorpay_order_id]
                );

                await db.query(
                    "INSERT INTO buy_course (course_name, user_id, course_id) VALUES ((SELECT course_name FROM payments WHERE transaction_id = $1), (SELECT user_id FROM payments WHERE transaction_id = $1), (SELECT course_id FROM payments WHERE transaction_id = $1))",
                    [razorpay_order_id]
                );
                res.json({ status: "SUCCESS", message: "Payment verified successfully" });
            } else {
                // Update DB to FAILED if signature mismatch
                await db.query(
                    "UPDATE payments SET payment_status = 'FAILED' WHERE transaction_id = $1",
                    [razorpay_order_id]
                );
                res.status(400).json({ status: "FAILED", message: "Invalid signature" });
            }
        } catch (error) {
            console.error("Payment Verification Error:", error);
            res.status(500).json({ error: "Failed to verify payment" });
        }
    });

    // --- 3. Razorpay Webhook (Backend-to-Backend Safety) ---
    // Isse Razorpay Dashboard mein setup karein (URL: your-domain.com/api/payment/webhook)
    router.post("/webhook", async (req, res) => {
        try {
            const signature = req.headers["x-razorpay-signature"];
            const secret = process.env.RAZORPAY_WEBHOOK_SECRET; 

            const body = JSON.stringify(req.body);
            const expectedSignature = crypto
                .createHmac("sha256", secret)
                .update(body)
                .digest("hex");

            if (signature !== expectedSignature) {
                return res.status(400).send("Invalid Webhook Signature");
            }

            const event = req.body.event;
            const orderId = req.body.payload.payment.entity.order_id;

            if (event === "payment.captured" || event === "payment.authorized") {
                await db.query(
                    "UPDATE payments SET payment_status = 'SUCCESS' WHERE transaction_id = $1",
                    [orderId]
                );
            }

            res.status(200).send("OK");
        } catch (err) {
            console.error("Webhook Error:", err);
            res.status(500).send("Internal Server Error");
        }
    });

    // --- 4. Get Payment History ---
    router.get("/history/:userId", async (req, res) => {
        try {
            const { userId } = req.params;
            
            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }

            const result = await db.query(
                "SELECT * FROM payments WHERE user_id = $1 ORDER BY payment_date DESC",
                [userId]
            );
            res.json(result.rows);
        } catch (error) {
            console.error("Payment History Error:", error);
            res.status(500).json({ error: "Failed to fetch payment history" });
        }
    });

    // return router;
// };

export default router;


// export default createPaymentRouter;