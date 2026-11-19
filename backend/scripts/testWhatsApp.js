
import "dotenv/config";

import {
  sendWhatsAppMessage
} from "../modules/notifications/whatsapp.service.js";

const to = process.env.TEST_WHATSAPP_TO;

if (!to) {
  throw new Error("Set TEST_WHATSAPP_TO in backend/.env");
}

try {
  const result = await sendWhatsAppMessage({
    to,
    variables: {}
});

  console.log("Twilio message SID:", result.sid);
  console.log("Initial status:", result.status);
} catch (error) {
  console.error("WhatsApp test failed:", error.message);
  process.exitCode = 1;
}
