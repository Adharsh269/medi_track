
import "dotenv/config";

import {
  generateWebReminders
} from "../modules/notifications/notification.service.js";

async function main() {
  try {
    const result = await generateWebReminders();

    console.log(
      `New web reminders created: ${result.created}`
    );
  } catch (error) {
    console.error(
      "Scheduler failed:",
      error.message
    );
    process.exitCode = 1;
  }
}

await main();
