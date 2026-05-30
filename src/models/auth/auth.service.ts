import bcrypt from "bcryptjs";
import type { ILoginUser, IUser } from "./auth.interface";
import { pool } from "../../db";
import jwt from 'jsonwebtoken'
import config from "../../config";

const createUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload
  const hashPassword = await bcrypt.hash(password, 10)

  // inserting data into db
  const result = await pool.query(`
    INSERT INTO users(name, email, password, role)
    VALUES($1, $2, $3, COALESCE($4, 'contributor'))
    RETURNING *
  `, [name, email, hashPassword, role])

  delete result.rows[0].password

  return result
}

const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload

  const userData = await pool.query(`
    SELECT * FROM users WHERE email=$1  
  `, [email])

  if (userData.rows.length === 0) {
    throw new Error('Invalid Credentials')
  }

  const user: IUser = userData.rows[0]

  // MATCHING THE PASSWORD
  const matchedPassword = await bcrypt.compare(password, user.password as string)
  if (!matchedPassword) {
    throw new Error('Invalid Credentials')
  }

  // JWT TOKEN GENERATE
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email
  }

  const accessToken = jwt.sign(jwtPayload, config.jwt_secret as string)
  // delete user.password
  const { password: _, ...userWithoutPassword } = user // pick data without password, it's called destructring or rest operator
  const loginInfo = {
    token: accessToken,
    user: userWithoutPassword
  }

  return loginInfo
}

export const authService = {
  createUserIntoDB,
  loginUser
}