
import express from "express";
import {
  getPatients,
  getPatientById,
} from "./patient.controller.js";

const router = express.Router();

router.get("/", getPatients);
router.get("/:id", getPatientById);

export default router;
