import type { NextFunction, Request, Response } from "express";
import type { ROLES } from "../types";
import { StatusCodes } from "http-status-codes";
import { decodeToken } from "../utils/jwt";
import { pool } from "../db";

const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(roles)

      const token = req.headers.authorization

      if (!token) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          status: false,
          message: 'Unauthorize access'
        })
      }

      const decodeTokenData = decodeToken(token as string)

      // finding the user on db
      const userData = await pool.query(`
      SELECT * FROM users WHERE email=$1  
    `, [decodeTokenData.email])

      const user = userData.rows[0]

      if (userData.rows.length === 0) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: false,
          message: 'User not found'
        })
      }

      if (roles.length && !roles.includes(user.role)) {
        res.status(StatusCodes.FORBIDDEN).json({
          status: false,
          message: 'Forbidden, This role has no access'
        })
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

export default auth