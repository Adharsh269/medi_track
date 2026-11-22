
import twilio from "twilio";

let client;

function getTwilioClient() {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
      throw new Error("Missing Twilio credentials");
    }

    client = twilio(sid, token);
  }

  return client;
}


export async function sendWhatsAppMessage({
  to,
  variables = {}
}) {
  if (!to) {
    throw new Error("Recipient is required");
  }

  const from = process.env.TWILIO_WHATSAPP_FROM;
  const contentSid = process.env.TWILIO_CONTENT_SID;

  if (!from || !contentSid) {
    throw new Error(
      "Missing WhatsApp sender or Content SID"
    );
  }

  const recipient = to.startsWith("whatsapp:")
    ? to
    : `whatsapp:${to}`;

  const message = await getTwilioClient().messages.create({
    from,
    to: recipient,
    contentSid,
    contentVariables: JSON.stringify(variables)
  });

  return {
    sid: message.sid,
    status: message.status
  };
}

