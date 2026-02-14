import express from "express";
import { registerStudent, registerTutor, login } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register/student", registerStudent);
router.post("/register/tutor", registerTutor);
router.post("/login", login);

export default router;
