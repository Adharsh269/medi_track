
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { pool } from "./config/db.js";
import patientRoutes from "./modules/patients/patient.routes.js";
import profileRoutes from './routes/profiles.js'

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test endpoint for Postman
app.post("/api/test", (req, res) => {
  console.log("Received body:", req.body);

  res.status(200).json({
    message: "Postman body received successfully!",
    receivedData: req.body,
  });
});


app.use("/api/patients", patientRoutes);
//using the profile routes.
app.use('/api/profiles',profileRoutes);

// checking the apis endpoinst
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MedicTrack backend is running",
  });
});

//database connection checkup
app.get("/api/health/db", async(req, res) => {
  try{
    await pool.query("SELECT 1");
    res.json({
      success: true,
      message: "Database connection successful",
    });
  } catch(err){
    console.error("Database checking failed:", err.message);
    res.status(500).json({
      success:false,
      message:"Database connection failed."
    });
  }
});

//seeing the tables in the database
app.get("/api/health/tables", async (req, res) =>{
  try {
    const result = await pool.query(`
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      res.status(200).json({
        success:true,
        count:result.rows.length,
        tables:result.rows
      });
  } catch (error) { 
    console.error("Table checking failed:", error)
    res.status(500).json({
      success:false,
      message:"Failed to retrieve messages."
    })
  }
});

app.get("/api/health/columns/:table", async (req, res) => {
  const allowedTables = [
    "profiles",
    "organizations",
    "caretaker_assignments",
    "patient_family_contacts",
    "medications",
    "dose_logs",
    "notifications",
    "notification_recipients",
    "adherence_scores",
  ];

  const { table } = req.params;

  if (!allowedTables.includes(table)) {
    return res.status(400).json({
      success: false,
      message: "Unknown table",
    });
  }

  try {
    const result = await pool.query(
      `SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position`,
      [table]
    );

    res.json({
      success: true,
      table,
      columns: result.rows,
    });
  } catch (error) {
    console.error("Column lookup failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not retrieve table columns",
    });
  }
});

// Starting the server, checking whether the port is running on 5000 port.
app.listen(PORT, () => {
  console.log(`MedicTrack API running at http://localhost:${PORT}`);
});
