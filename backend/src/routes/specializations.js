import express from "express";
import * as specializationController from "../controllers/specialization.controller.js";

const router = express.Router();

router.get("/subjects", specializationController.getAllSubjects);
router.get("/by-mata-pelajaran/:mataPelajaranId", specializationController.getSpecializationsBySubject);
router.get("/stats", specializationController.getCorrelationStats);
router.post("/validate", specializationController.validateCorrelation);

export default router;
