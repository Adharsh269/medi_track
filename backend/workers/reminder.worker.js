
import "dotenv/config";
import cron from "node-cron";

import { deliverDueReminders } from
  "../modules/notifications/reminder.delivery.js";

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

    // 1. Generate scheduled patient reminders
    const reminders = await generateWebReminders();
    console.log("New reminders:", reminders.created);

    // 2. Mark overdue doses as missed
    const missed = await markOverdueDoses();
    console.log("Newly missed doses:", missed.missed);

    // 3. Generate caretaker alerts
    const alerts = await generateMissedDoseAlerts();
    console.log("New missed-dose alerts:", alerts.created);

    // 4. Generate family WhatsApp alerts
    const familyAlerts = await generateFamilyMissedAlerts();
    console.log(
      "New family WhatsApp alerts:",
      familyAlerts.created
    );

    // 5. Web Push delivery will be connected here,
    // after we inspect the existing push service.

    const delivery = await deliverDueReminders();

    console.log("Push delivery result:", delivery);

    console.log("Scheduler run completed");
  } catch (error) {
    console.error("Scheduler error:", error);
  } finally {
    running = false;
  }
}

cron.schedule("* * * * *", runReminderJob, {
  timezone: "UTC"
});

console.log("MedicTrack scheduler started");

await runReminderJob();
