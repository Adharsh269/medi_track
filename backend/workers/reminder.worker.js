
import "dotenv/config";
import cron from "node-cron";

import {
  generateWebReminders,
  markOverdueDoses,
  generateMissedDoseAlerts,
  generateFamilyMissedAlerts
} from "../modules/notifications/notification.service.js";

let running = false;

export async function runReminderJob() {
  if (running) {
    console.log("Previous scheduler run still active");
    return;
  }

  running = true;

  try {
    console.log("Starting MedicTrack scheduler...");

    const reminders = await generateWebReminders();

    console.log(
      `New reminders: ${reminders.created}`
    );

    const missed = await markOverdueDoses();


    const alerts = await generateMissedDoseAlerts();

    console.log(
    `New missed-dose alerts: ${alerts.created}`
    );

    console.log(
      `Newly missed doses: ${missed.missed}`
    );

    const familyAlerts = await generateFamilyMissedAlerts();

    console.log(
      `New family WhatsApp alerts: ${familyAlerts.created}`
    );

    console.log("Scheduler run completed");
  } catch (error) {
    console.error(
      "Scheduler error:",
      error.message
    );
  } finally {
    running = false;
  }
}

// Run every minute.
cron.schedule("* * * * *", runReminderJob, {
  timezone: "UTC"
});

console.log("MedicTrack scheduler started");

// Also run immediately when the worker starts.
await runReminderJob();
