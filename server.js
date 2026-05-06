import express from "express";
import { connectDB } from "./db/db.js";
import courseRoutes, { setCourseDB } from "./routes/courseRoutes.js";
import user, { setUserDB } from "./routes/user.js";
import callback, { setCallbackDB } from "./routes/callback.js";
import student, { setStudentDB } from "./routes/student.js";
import cors from "cors";
import payment from "./routes/payment.js";
import events, { setEventsDB } from "./routes/events.js";
import { configDotenv } from "dotenv";
import classroom, { setClassroomDB } from "./routes/classroom.js";
import builder, { setBuilderDB } from "./routes/builder.js";
import clients, { setClientDB } from "./routes/client.js";
// import chatbot from './routes/chatbot.js'
import webhook, { setWebhookDB } from "./routes/webhook.js";
configDotenv();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  cors({
    origin: [
      process.env.clientUrl,
      "http://127.0.0.1:5500",
      "http://127.0.0.1:5501",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use("/uploads", express.static("uploads"));

let db;

const startServer = async () => {
  try {
    db = await connectDB(); // database auto create
    console.log("✅ Database connected successfully!");

    // Pass db to user routes
    setUserDB(db);

    app.use((req, res, next) => {
      console.log("👉 HIT:", req.method, req.url);
      next();
    });

    setBuilderDB(db);
    setClientDB(db);
    setWebhookDB(db);
    setCourseDB(db);
    setCallbackDB(db);
    setStudentDB(db);
    setEventsDB(db);
    setClassroomDB(db);
    app.use("/webhook", (req, res, next) => {
      console.log("👉 WEBHOOK HIT:", req.method, req.originalUrl);
      next();
    });
    app.use("/webhook", webhook);
    // Register routes AFTER database connection is established
    app.use("/add-course", courseRoutes);
    app.use("/callback", callback);
    app.use("/students", student);
    // app.use("/api/payment", createPaymentRouter(db))
    app.use("/api/payment", payment);
    app.use("/api", events);
    app.use("/user", user);
    app.use("/classroom", classroom);
    // app.use("/chatbot", chatbot)
    app.use("/flow", builder);
    app.use("/clients", clients);

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log("🚀 Server running on port:", PORT));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
