import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  businessId?: string
  businessEmail?: string
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.'
      })
      return
    }

    const token = authHeader.split(' ')[1]

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET as string
    ) as any

    // Attach businessId to request
    req.businessId = decoded.id
    req.businessEmail = decoded.email

    next()
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Session expired. Please log in again.'
    })
  }
}