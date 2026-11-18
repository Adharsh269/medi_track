
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";

import {
  getMyPatients,
  getAssignments,
  createAssignment,
  revokeAssignment
} from "./assignment.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyPatients);
router.get("/", getAssignments);
router.post("/", createAssignment);
router.patch("/:id/revoke", revokeAssignment);

export default router;
