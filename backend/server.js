
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { pool } from "./config/db.js";
import patientRoutes from "./modules/patients/patient.routes.js";

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

// checking the apis endpoinst
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MedicTrack backend is running",
  });
});

// Starting the server, checking whether the port is running on 5000 port.
app.listen(PORT, () => {
  console.log(`MedicTrack API running at http://localhost:${PORT}`);
});
