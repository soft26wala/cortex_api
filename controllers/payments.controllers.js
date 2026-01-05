import { connectDB } from "../db/db.js";
import crypto from "crypto";

let db;

// Connect DB only once
(async () => {
  db = await connectDB();
})();

exports.createOrder = async (req, res) => {
   try {
      const { course_id } = req.body;

      if (!course_id) {
          return res.status(400).json({ error: "Course ID is required" });
      }


   
        const course = await db.query("SELECT * FROM courses_offered WHERE course_id = $1", [course_id]);
        if (!course.rows.length) {
            return res.status(404).json({ error: "Course not found" });
        }

        console.log("course price" ,course.rows[0].course_price);
        const amount = course.rows[0].course_price; 
        
        // const razorpay = createRazorpayInstance();
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `rcp_${Date.now()}`,
        };

        razorpayInstance.orders.create(options, (err, order) =>{
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Razorpay order creation failed" });
            }
            return res.status(200).json(order);
        })

       
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
}


exports.verifyPayment = async (req, res) => {
    const { order_id, payment_id, signature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(order_id + "|" + payment_id);
    const generatedSignature = hmac.digest("hex");
    if (generatedSignature === signature) {

        const result = await db.query(
            "INSERT INTO payments (transaction_id, user_id, course_name, payment_status, amount, course_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [order_id, req.user.id, course_name, "SUCCESS", amount, course_id]
        );


        res.status(200).json({ success: true, message: "Payment verified successfully" });
    }
    else {
        res.status(400).json({ success: false, message: "Invalid signature" });
    } 
}