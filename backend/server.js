import { createApp } from './app.js';
import { pool } from './config/db.js';

<<<<<<< HEAD
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import profileRoutes from "./routes/profile.js";
import medicationRoutes from "./modules/medications/medication.routes.js";
import doseRoutes from "./modules/doses/dose.routes.js";
import assignmentRoutes from "./modules/caretakers/assignment.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import pushRoutes from "./modules/notifications/push.routes.js";
// import {
//   startNotificationScheduler
// } from "./jobs/notificationScheduler.js";
import { startNotificationScheduler } from
  "./modules/notifications/notification.scheduler.js";

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

// 8.Notification routes
app.use("/api/notifications", notificationRoutes);

app.use("/api/push", pushRoutes);

// 6. Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// 7. Start server
app.listen(PORT, () => {
  console.log(`MedicTrack API running on http://localhost:${PORT}`);

  if (process.env.ENABLE_NOTIFICATION_SCHEDULER === "true") {
    startNotificationScheduler();
  }
});
=======
// This API-only assignment has no login or authorization middleware.
// Keep it local; integrate authentication before deployment or real-user access.
if (process.env.NODE_ENV === 'production') {
  throw new Error('Add authentication/authorization before production deployment.');
}
const app = createApp(pool);
const port = Number(process.env.PORT || 5000);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Database API running at http://127.0.0.1:${port}`);
});
function shutdown() {
  server.close(async () => { await pool.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
>>>>>>> origin/branch2
