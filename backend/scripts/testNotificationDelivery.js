
import "dotenv/config";

import {
  sendTestNotification
} from "../modules/notifications/notification.delivery.js";

const notificationId = Number(
  process.env.TEST_NOTIFICATION_ID
);

const testPhone = process.env.TEST_WHATSAPP_TO;

if (!Number.isSafeInteger(notificationId) ||
    notificationId <= 0) {
  throw new Error("Invalid TEST_NOTIFICATION_ID");
}

if (!testPhone) {
  throw new Error("Missing TEST_WHATSAPP_TO");
}

try {
  const result = await sendTestNotification({
    notificationId,
    testPhone
  });

  console.log("Test notification sent:");
  console.log(result);
} catch (error) {
  console.error(
    "Delivery test failed:",
    error.message
  );

  process.exitCode = 1;
}
