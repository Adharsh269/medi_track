
import * as webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase server credentials");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function configureWebPush() {
  const {
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    VAPID_SUBJECT
  } = process.env;

  if (
    !VAPID_PUBLIC_KEY ||
    !VAPID_PRIVATE_KEY ||
    !VAPID_SUBJECT
  ) {
    throw new Error("Missing VAPID configuration");
  }

  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(userId, payload) {
  configureWebPush();

  const db = getAdminClient();

  const { data: subscriptions, error } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) throw error;

  const results = [];

  for (const row of subscriptions ?? []) {
    const subscription = {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth
      }
    };

    try {
      const response = await webpush.sendNotification(
        subscription,
        JSON.stringify(payload),
        { TTL: 300 }
      );

      results.push({
        subscriptionId: row.id,
        success: true,
        statusCode: response.statusCode
      });
    } catch (err) {
      console.error(
        `Push failed for subscription ${row.id}:`,
        err.statusCode || err.message
      );

      // Expired subscriptions can be removed.
      if (err.statusCode === 404 || err.statusCode === 410) {
        const { error: deleteError } = await db
          .from("push_subscriptions")
          .delete()
          .eq("id", row.id)
          .eq("user_id", userId);

        if (deleteError) {
          console.error(
            "Failed to remove expired subscription:",
            deleteError.message
          );
        }
      }

      results.push({
        subscriptionId: row.id,
        success: false,
        statusCode: err.statusCode || null
      });
    }
  }

  return {
    userId,
    totalSubscriptions: subscriptions?.length ?? 0,
    results
  };
}
