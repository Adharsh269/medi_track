
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";

import {
  listDoses,
  getDose,
  updateDose
} from "./dose.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/today", (req, res) => {
  req.params.today = "today";
  return listDoses(req, res);
});

router.get("/", listDoses);
router.get("/:id", getDose);
router.patch("/:id", updateDose);

export default router;
