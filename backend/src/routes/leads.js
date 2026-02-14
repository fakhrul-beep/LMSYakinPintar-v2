import express from "express";
import * as leadController from "../controllers/lead.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { studentLeadSchema, tutorLeadSchema } from "../validations/lead.validation.js";

const router = express.Router();

router.post("/student", validate(studentLeadSchema), leadController.createStudentLead);
router.post("/tutor", validate(tutorLeadSchema), leadController.createTutorLead);

export default router;
