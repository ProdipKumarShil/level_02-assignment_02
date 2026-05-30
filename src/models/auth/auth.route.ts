import { Router } from "express";
import app from "../../app";
import { authController } from "./auth.controller";

const router = Router()

router.post('/signup', authController.userSignup)
router.post('/login', authController.userLogin)

export const authRoute = router