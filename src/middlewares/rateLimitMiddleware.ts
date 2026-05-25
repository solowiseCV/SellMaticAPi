import { Request, Response, NextFunction } from 'express'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

export const rateLimiter = (
  maxRequests: number,
  windowMinutes: number
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}:${req.path}`
    const now = Date.now()
    const windowMs = windowMinutes * 60 * 1000

    if (!store[key] || store[key].resetAt < now) {
      store[key] = { count: 1, resetAt: now + windowMs }
      next()
      return
    }

    store[key].count++

    if (store[key].count > maxRequests) {
      res.status(429).json({
        success: false,
        error: `Too many attempts. Please try again in ${windowMinutes} minutes.`
      })
      return
    }

    next()
  }
}