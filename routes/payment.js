import express from "express";
import { connectDB } from "../db/db.js";
import { createOrder , verifyPayment } from "../controllers/payments.controllers.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

let db;

// Connect DB only once
(async () => {
  db = await connectDB();
})();


router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);


export default router;


// export default createPaymentRouter;