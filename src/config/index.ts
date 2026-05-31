import path from 'path'
import dotenv from 'dotenv'

dotenv.config({
  path: path.join(process.cwd(), '.env')
})

const config = {
  port: process.env.PORT,
  connection_string: process.env.CONNECTIONSTRING,
  access_secret: process.env.ACCESS_SECRET,
  refresh_secret: process.env.REFRESH_SECRET,
  access_expire: process.env.ACCESS_EXPIRE,
  refresh_expire: process.env.REFRESH_EXPIRE,

}

export default config