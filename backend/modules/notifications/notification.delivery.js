
import { createClient } from "@supabase/supabase-js";

import {
  sendWhatsAppMessage
} from "./whatsapp.service.js";

function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

export async function sendTestNotification({
  notificationId,
  testPhone
}) {
  if (process.env.WHATSAPP_TEST_MODE !== "true") {
    throw new Error("Test mode is disabled");
  }

  if (!notificationId || !testPhone) {
    throw new Error(
      "Notification ID and test phone are required"
    );
  }

  const supabase = getAdminClient();

  const { data: notification, error } =
    await supabase
      .from("notifications")
      .select(
        "id, type, channel, status, scheduled_time"
      )
      .eq("id", notificationId)
      .single();

  if (error) throw error;

  if (notification.channel !== "whatsapp") {
    throw new Error(
      "This notification is not a WhatsApp notification"
    );
  }

  if (notification.status !== "pending") {
    throw new Error(
      "Notification is not pending"
    );
  }

  // Controlled test: sends only to the test number.
  // The existing Sandbox template is used.
  const result = await sendWhatsAppMessage({
    to: testPhone,
    variables: {}
  });

  return {
    notificationId,
    twilioMessageSid: result.sid,
    twilioStatus: result.status,
    testOnly: true
  };
}
