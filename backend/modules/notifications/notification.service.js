
import { createClient } from "@supabase/supabase-js";

let adminClient;

function getAdminClient() {
  if (!adminClient) {   
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "Missing Supabase server configuration"
      );
    }

    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return adminClient;
}

export async function generateWebReminders() {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc(
    "generate_web_reminders"
  );

  if (error) {
    console.error(
      "Reminder generation failed:",
      error.message
    );
    throw error;
  }

  return {
    created: data ?? 0
  };
}


export async function markOverdueDoses() {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc(
    "mark_overdue_doses_missed",
    {
      p_grace_minutes: 30
    }
  );

  if (error) {
    console.error(
      "Missed-dose detection failed:",
      error.message
    );
    throw error;
  }

  return {
    missed: data ?? 0
  };
}


export async function generateMissedDoseAlerts() {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc(
    "generate_missed_dose_alerts"
  );

  if (error) {
    console.error(
      "Missed-dose alert generation failed:",
      error.message
    );
    throw error;
  }

  return {
    created: data ?? 0
  };
}


export async function generateFamilyMissedAlerts() {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc(
    "generate_family_missed_alerts"
  );

  if (error) {
    console.error(
      "Family alert generation failed:",
      error.message
    );
    throw error;
  }

  return {
    created: data ?? 0
  };
}

