
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db.js";
import patientRoutes from "./modules/patients/patient.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/test", (req, res) => { 
  console.log("Received body:", req.body);

  res.status(200).json({
    message: "Postman body received successfully!",
    receivedData: req.body,
  });
});

app.use("/api/patients", patientRoutes);

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
