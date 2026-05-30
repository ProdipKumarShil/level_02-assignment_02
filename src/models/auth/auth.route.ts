import { Router } from "express";
import app from "../../app";
import { authController } from "./auth.controller";

const router = Router()

app.post('/signup', authController.userSignup)
app.post('/login', authController.userLogin)

export const authRoute = router