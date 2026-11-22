
import express from "express";
import { requireAuth } from "../../middleware/auth.js";

import {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication
} from "./medication.controller.js";

const router = express.Router();

// Protect all medication routes
router.use(requireAuth);

// GET all medications
router.get("/", getMedications);

// GET one medication
router.get("/:id", getMedication);

// POST - Create a medication
router.post(
  "/",
  (req, res, next) => {
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Received body:", req.body);
    console.log("Is array:", Array.isArray(req.body));

    next();
  },
  createMedication
);

// PATCH - Update medication
router.patch("/:id", updateMedication);

// DELETE - Delete medication
router.delete("/:id", deleteMedication);

export default router;
