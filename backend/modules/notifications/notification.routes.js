
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";

import {
  getNotifications,
  getNotification,
  getCaretakerNotifications
} from "./notification.controller.js";

const router = Router();

router.use(requireAuth);

// Patient notifications
router.get("/", getNotifications);

// Caretaker inbox
router.get("/caretaker", getCaretakerNotifications);

// Individual patient notification
router.get("/:id", getNotification);

export default router;
