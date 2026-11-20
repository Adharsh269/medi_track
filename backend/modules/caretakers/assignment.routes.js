
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";

import {
  getMyPatients,
  getAssignments,
  createAssignment,
  revokeAssignment,
  getAssignedPatientDetails,
  getAssignedPatientMedications,
  getAssignedPatientDoses,
  getCaretakerAlerts
} from "./assignment.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyPatients);
router.get("/", getAssignments);
router.get("/patients/:patientId", getAssignedPatientDetails);
router.post("/", createAssignment);
router.patch("/:id/revoke", revokeAssignment);
router.get(
  "/patients/:patientId/medications",
  getAssignedPatientMedications
);
router.get(
  "/patients/:patientId/doses",
  getAssignedPatientDoses
);
router.get("/alerts", getCaretakerAlerts);

export default router;
