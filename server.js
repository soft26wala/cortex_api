import express from "express";
import { connectDB } from "./db/db.js";
import courseRoutes from './routes/courseRoutes.js'
import user from './routes/user.js'
import callback from './routes/callback.js'
import cors from 'cors'
import { configDotenv } from "dotenv";
configDotenv()

const app = express();
app.use(express.json());
app.use(cors({
  origin: [process.env.clientUrl,
    "http://127.0.0.1:5500"
  ],
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));
app.use('/uploads', express.static('uploads'));
app.use("/add-course", courseRoutes)
app.use("/callback", callback)
app.use("/user", user)
let db;

const startServer = async () => {
  db = await connectDB();   // database auto create
};

startServer();

app.get
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log("Server running on :" , PORT));
