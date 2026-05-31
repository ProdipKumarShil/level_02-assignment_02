import jwt, { type JwtPayload } from 'jsonwebtoken'
import config from '../config'
import type { IPUser } from '../models/auth/auth.interface'

export const signToken = (payload: IPUser) => {

  console.log(payload)
  const accessToken = jwt.sign(payload, config.access_secret as string, {
    expiresIn: '1d'
  })

  return accessToken
}

export const decodeToken = (payload: string) => {
  return jwt.verify(payload, config.access_secret as string) as JwtPayload
}