import type { Request, Response } from "express"
import { authService } from "./auth.service"
import { StatusCodes } from "http-status-codes"

const userSignup = async (req: Request, res: Response) => {
  try {
    const result = await authService.createUserIntoDB(req.body)

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    })

  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.message
    })
  }
}
const userLogin = async (req: Request, res: Response) => {
  try {
    console.log(req.body)
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.message
    })
  }
}

export const authController = { userSignup, userLogin }