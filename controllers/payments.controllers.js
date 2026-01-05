import { connectDB } from "../db/db.js";
import crypto from "crypto";
import { createRazorpayInstance } from "../config/razorpay.config.js";

let db;
// Connect DB only once
(async () => {
    db = await connectDB();
})();

export const createOrder = async (req, res) => {
    try {
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ error: "Course ID is required" });
        }

        const course = await db.query(
            "SELECT * FROM courses_offered WHERE course_id = $1",
            [course_id]
        );
        if (!course.rows.length) {
            return res.status(404).json({ error: "Course not found" });
        }

        const amount = course.rows[0].course_price;

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `rcp_${Date.now()}`,
        };

        const razorpayInstance = createRazorpayInstance();
        razorpayInstance.orders.create(options, (err, order) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Razorpay order creation failed" });
            }
            return res.status(200).json(order);
        });
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { order_id, payment_id, signature } = req.body;

        const secret = process.env.RAZORPAY_KEY_SECRET;
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(order_id + "|" + payment_id);
        const generatedSignature = hmac.digest("hex");

        if (generatedSignature === signature) {
            // Optionally, you can insert payment details into DB here if you have them
            return res.status(200).json({ success: true, message: "Payment verified successfully" });
        }

        return res.status(400).json({ success: false, message: "Invalid signature" });
    } catch (error) {
        console.error("verifyPayment error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};