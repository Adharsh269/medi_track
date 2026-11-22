import { createClient } from "@supabase/supabase-js";
import {
  deliverDueWebNotifications
} from "./push.delivery.js";

let supabaseAdmin;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}

let isRunning = false;

async function runFunction(name, params = {}) {
  const { data, error } = await getSupabaseAdmin().rpc(
        name,
        params
    );

  if (error) {
    throw new Error(`${name}: ${error.message}`);
  }

  console.log(`[Scheduler] ${name}: ${data}`);

  return data;
}

export async function processNotifications() {
  if (isRunning) {
    console.log("[Scheduler] Previous run still active");
    return;
  }

  isRunning = true;

  try {
    console.log("[Scheduler] Processing notifications");

    await runFunction("generate_web_reminders");

    await runFunction("mark_overdue_doses_missed", {
      p_grace_minutes: 30,
    });

    await runFunction("generate_missed_dose_alerts");

    await runFunction("generate_family_missed_alerts");

    console.log(
    "[Scheduler] Push delivery enabled:",
    process.env.ENABLE_PUSH_DELIVERY
    );

    if (process.env.ENABLE_PUSH_DELIVERY === "true") {
        await deliverDueWebNotifications();
        }

    console.log("[Scheduler] Completed successfully");
  } catch (error) {
    console.error("[Scheduler] Error:", error.message);
  } finally {
    isRunning = false;
  }
}

export function startNotificationScheduler() {
  if (process.env.ENABLE_NOTIFICATION_SCHEDULER !== "true") {
    console.log("[Scheduler] Disabled");
    return;
  }

  console.log("[Scheduler] Started (every 60 seconds)");

  processNotifications();

  return setInterval(processNotifications, 60_000);
}