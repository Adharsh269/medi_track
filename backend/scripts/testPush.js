
import "dotenv/config";

import {
  sendPushToUser
} from "../modules/notifications/push.service.js";

const userId = process.env.TEST_PUSH_USER_ID;

if (!userId) {
  throw new Error(
    "Missing TEST_PUSH_USER_ID in backend/.env"
  );
}

if (process.env.PUSH_TEST_ENABLED !== "true") {
  throw new Error(
    "Set PUSH_TEST_ENABLED=true for this controlled test"
  );
}

try {
  const result = await sendPushToUser(userId, {
    title: "MedicTrack Test Reminder",
    body: "Your browser push notification is working!",
    url: "/",
    tag: "medictrack-test-push"
  });

  console.log(
    "Push test result:",
    JSON.stringify(result, null, 2)
  );
} catch (error) {
  console.error("Push test failed:", error.message);
  process.exitCode = 1;
}
