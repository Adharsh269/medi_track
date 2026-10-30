
import express from "express";
// import {authinticate} from '../middleware/auth.js';

import {
    getProfiles,
    getProfileById,
    createProfiles,
    // getMyProfile
} from "../modules/profiles/profile.controller.js";

const router = express.Router();

// router.get("/me", authinticate, getMyProfile);
router.get("/", getProfiles);
router.get("/:id", getProfileById);
router.post("/", createProfiles);

export default router;
