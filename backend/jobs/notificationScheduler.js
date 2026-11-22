import {
  generateWebReminders,
  markOverdueDoses,
  generateMissedDoseAlerts,
  generateFamilyMissedAlerts
} from "../modules/notifications/notification.service.js";

const INTERVAL_MS = 60 * 1000;

let running = false;

export async function runNotificationJobs() {
  if (running) {
    console.log("Notification job already running. Skipping.");
    return;
  }

  running = true;

  try {
    const missed = await markOverdueDoses();
    const alerts = await generateMissedDoseAlerts();
    const family = await generateFamilyMissedAlerts();
    const reminders = await generateWebReminders();

    console.log("Notification job completed:", {
      missed: missed.missed,
      alerts: alerts.created,
      family: family.created,
      reminders: reminders.created
    });
  } catch (error) {
    console.error("Notification job failed:", error);
  } finally {
    running = false;
  }
}

export function startNotificationScheduler() {
  console.log("Notification scheduler started (every 60 seconds)");

  const timer = setInterval(runNotificationJobs, INTERVAL_MS);

  // First execution happens after one minute.
  return () => clearInterval(timer);
}