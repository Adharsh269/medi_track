
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";

import {
    getProfiles,
    getProfileById,
    createProfiles,
    getMyProfile
} from "../modules/profiles/profile.controller.js";

const router = express.Router();

router.get("/me", authenticate, getMyProfile);
router.get("/", getProfiles);
router.get("/:id", getProfileById);
router.post("/", createProfiles);

export default router;
