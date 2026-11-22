import { createClient } from "@supabase/supabase-js";
import { sendPushToUser } from "./push.service.js";

let db;

function getAdminClient() {
  if (!db) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    db = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return db;
}

export async function deliverDueWebNotifications() {
  const afterId = Number(process.env.PUSH_DELIVERY_AFTER_ID);

  if (!Number.isSafeInteger(afterId) || afterId < 0) {
    throw new Error("Set a valid PUSH_DELIVERY_AFTER_ID");
  }
  
  const db = getAdminClient();
  const { data: notifications, error } = await db.rpc(
    "claim_due_web_notifications",
    {
      p_after_id: afterId,
      p_limit: 20,
    }
  );

  if (error) throw error;

  for (const notification of notifications ?? []) {
    try {
      const { data: recipients, error: recipientError } =
        await db
          .from("notification_recipients")
          .select("id, user_id")
          .eq("notification_id", notification.id)
          .not("user_id", "is", null);

      if (recipientError) throw recipientError;

      let attempted = false;
      let allSucceeded = true;

      for (const recipient of recipients ?? []) {
        const result = await sendPushToUser(
          recipient.user_id,
          {
            title:
              notification.type === "missed_alert"
                ? "MedicTrack: Missed Dose"
                : "MedicTrack: Medication Reminder",
            body: notification.message,
            url: "/",
          }
        );
        console.log(
        `[Push] Notification ${notification.id}, recipient ${recipient.user_id}:`,
        JSON.stringify(result)
        );

        const success =
          result.totalSubscriptions > 0 &&
          result.results.length > 0 &&
          result.results.every((r) => r.success);

        attempted ||= result.totalSubscriptions > 0;
        allSucceeded &&= success;

        if (success) {
          const { error: updateError } = await db
            .from("notification_recipients")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", recipient.id);

          if (updateError) throw updateError;
        }
      }

      const status =
        attempted && allSucceeded ? "sent" : "failed";

      const update = { status };

      if (status === "sent") {
        update.sent_at = new Date().toISOString();
      }

      const { error: updateError } = await db
        .from("notifications")
        .update(update)
        .eq("id", notification.id)
        .eq("status", "processing");

      if (updateError) throw updateError;

      console.log(
        `[Push] Notification ${notification.id}: ${status}`
      );
    } catch (error) {
      console.error(
        `[Push] Notification ${notification.id}:`,
        error.message
      );

      await db
        .from("notifications")
        .update({ status: "failed" })
        .eq("id", notification.id)
        .eq("status", "processing");
    }
  }
}