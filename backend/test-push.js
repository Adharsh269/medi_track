import "dotenv/config";
import { sendPushToUser } from "./modules/notifications/push.service.js";

const userId = process.env.TEST_PUSH_USER_ID;

if (!userId) {
  throw new Error("TEST_PUSH_USER_ID is required");
}

const result = await sendPushToUser(userId, {
  title: "MedicTrack Test",
  body: "Your browser notifications are working!",
  url: "/",
});

console.log("Push test result:", JSON.stringify(result, null, 2));