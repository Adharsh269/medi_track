
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import profileRoutes from "./routes/profile.js";
import medicationRoutes from "./modules/medications/medication.routes.js";
import doseRoutes from "./modules/doses/dose.routes.js";
import assignmentRoutes from "./modules/caretakers/assignment.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// 2. Parse incoming JSON requests
app.use(express.json({ limit: "100kb" }));

// 3. Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "MedicTrack API",
  });
});

// 4. Profile routes
app.use("/api", profileRoutes);

// 5. Medication routes
app.use("/api/medications", medicationRoutes);

//6. Dose routes
app.use("/api/doses", doseRoutes);

//7. Caretaker routes
app.use("/api/assignments", assignmentRoutes);

// 6. Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// 7. Start server
app.listen(PORT, () => {
  console.log(`MedicTrack API running on http://localhost:${PORT}`);
});
