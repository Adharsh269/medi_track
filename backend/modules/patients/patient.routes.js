import express from "express";
import { createPatient } from "./patient.controller.js";

const router = express.Router();

router.post("/", createPatient);

export default router;
