
import { createClient } from "@supabase/supabase-js";
import { sendPushToUser } from "./push.service.js";

function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

async function deliverClaimed(db, functionName, title) {
  const { data: notifications, error } = await db.rpc(functionName);

  if (error) throw error;

  let delivered = 0;
  let failed = 0;

  for (const notification of notifications ?? []) {
    const notificationId = notification.notification_id;
    const recipientUserId = notification.recipient_user_id;

    try {
      const result = await sendPushToUser(recipientUserId, {
        title,
        body: notification.notification_message,
        url: "/",
      });

      const accepted = result.results.some((item) => item.success);
      const status = accepted ? "sent" : "failed";

      const { error: recipientError } = await db
        .from("notification_recipients")
        .update({
          status,
          ...(accepted
            ? { sent_at: new Date().toISOString() }
            : {}),
        })
        .eq("notification_id", notificationId)
        .eq("user_id", recipientUserId);

      if (recipientError) throw recipientError;

      const { error: notificationError } = await db
        .from("notifications")
        .update({
          status,
          ...(accepted
            ? { sent_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", notificationId);

      if (notificationError) throw notificationError;

      if (accepted) delivered++;
      else failed++;
    } catch (err) {
      console.error(
        `Notification ${notificationId} failed:`,
        err.message
      );

      failed++;

      // Mark the recipient as failed too.
      const { error: recipientError } = await db
        .from("notification_recipients")
        .update({ status: "failed" })
        .eq("notification_id", notificationId)
        .eq("user_id", recipientUserId);

      if (recipientError) {
        console.error(recipientError.message);
      }

      const { error: notificationError } = await db
        .from("notifications")
        .update({ status: "failed" })
        .eq("id", notificationId);

      if (notificationError) {
        console.error(notificationError.message);
      }
    }
  }

  return {
    claimed: notifications?.length ?? 0,
    delivered,
    failed,
  };
}

export async function deliverDueReminders() {
  const db = getAdminClient();

  const patientReminders = await deliverClaimed(
    db,
    "claim_due_web_reminders",
    "MedicTrack Reminder"
  );

  const caretakerAlerts = await deliverClaimed(
    db,
    "claim_due_web_missed_alerts",
    "MedicTrack Missed Dose Alert"
  );

  return {
    patientReminders,
    caretakerAlerts,
  };
}
