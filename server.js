import express from "express";
import { connectDB } from "./db/db.js";
import courseRoutes from './routes/courseRoutes.js'
import user, { setUserDB } from './routes/user.js'
import callback from './routes/callback.js'
import student from './routes/student.js'
import cors from 'cors'
import payment from './routes/payment.js'
import events from './routes/events.js'
import { configDotenv } from "dotenv";
configDotenv()

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: [process.env.clientUrl,
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501",
    "http://127.0.0.1:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options('*', cors());
app.use('/uploads', express.static('uploads'));

let db;

const startServer = async () => {
  try {
    db = await connectDB();   // database auto create
    console.log("✅ Database connected successfully!");
    
    // Pass db to user routes
    setUserDB(db);
    
    // Register routes AFTER database connection is established
    app.use("/add-course", courseRoutes)
    app.use("/callback", callback)
    app.use("/students", student)
    app.use("/api", payment)
    app.use("/api", events)
    app.use("/user", user) 
    
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log("🚀 Server running on port:", PORT));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
