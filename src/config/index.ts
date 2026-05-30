import path from 'path'
import dotenv from 'dotenv'

dotenv.config({
  path: path.join(process.cwd(), '.env')
})

const config = {
  port: process.env.PORT,
  connection_string: process.env.CONNECTIONSTRING
}

export default config