import express, { Request, Response } from 'express'
import webhookRoutes from './routes/webhook'
import authRoutes from './routes/auth.route'
import whatsappRoutes from './routes/whatsapp.route'

const app = express()

app.use(express.json())

// Allow cross-origin requests from the frontend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
    return
  }
  next()
})

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'SellMatic API is running.' })
})

// Routes
app.use('/auth', authRoutes)
app.use('/whatsapp', whatsappRoutes)
app.use('/webhook', webhookRoutes)
app.use('/', webhookRoutes) // Meta webhook fallback

// 404 handler for unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found.' })
})

export default app
