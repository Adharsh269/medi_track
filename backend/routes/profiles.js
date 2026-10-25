
import express from "express";
import {
    getProfiles,
    getProfileById,
} from "../modules/profiles/profile.controller.js";

const router = express.Router();

router.get("/", getProfiles);
router.get("/:id", getProfileById);

export default router;
