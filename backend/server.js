
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

//server code
app.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      message: "Patient backend is running!",
      database: "Connected to Supabase PostgreSQL",
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(503).json({
      message: "Backend is running, but database connection failed.",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
