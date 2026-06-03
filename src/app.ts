import express, { type Application, type Request, type Response } from 'express'
import { authRoutes } from './models/auth/auth.route'
import { issueRouters } from './models/issue/issue.router'

const app: Application = express()

app.use(express.json())

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: `Server is running`,
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/issues', issueRouters)

export default app