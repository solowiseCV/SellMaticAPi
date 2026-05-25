import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma";
import { AuthValidation } from "../validations/auth.validation";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

const JWT_SECRET = process.env.NEXTAUTH_SECRET as string;
const JWT_EXPIRES_IN = "7d";

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const validation = AuthValidation.register(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    const { businessName, ownerName, ownerEmail, ownerPhone, password } =
      validation.data!;

    try {
      // Check if a business with this email already exists
      const existing = await prisma.business.findUnique({
        where: { ownerEmail },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: "An account with this email already exists.",
        });
        return;
      }

      // Hash the password securely
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the business record
      const business = await prisma.business.create({
        data: {
          businessName,
          ownerName,
          ownerEmail,
          ownerPhone,
          password: hashedPassword,
        },
      });

      // Sign and issue JWT
      const token = jwt.sign(
        { id: business.id, email: business.ownerEmail },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      res.status(201).json({
        success: true,
        message: "Account created successfully.",
        token,
        business: {
          id: business.id,
          businessName: business.businessName,
          ownerName: business.ownerName,
          ownerEmail: business.ownerEmail,
          ownerPhone: business.ownerPhone,
          plan: business.plan,
          botActive: business.botActive,
          createdAt: business.createdAt,
        },
      });
    } catch (err: any) {
      console.error("[AuthController.register] Error:", err.message);
      res.status(500).json({
        success: false,
        error: "Something went wrong. Please try again.",
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    const validation = AuthValidation.login(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    const { ownerEmail, password } = validation.data!;

    try {
      // Fetch the business by email
      const business = await prisma.business.findUnique({
        where: { ownerEmail },
      });

      // Use a generic error to prevent email enumeration
      if (!business) {
        res.status(401).json({
          success: false,
          error: "Invalid email or password.",
        });
        return;
      }

      // Compare password against the stored hash
      const passwordMatches = await bcrypt.compare(password, business.password);
      if (!passwordMatches) {
        res.status(401).json({
          success: false,
          error: "Invalid email or password.",
        });
        return;
      }

      // Sign and issue JWT
      const token = jwt.sign(
        { id: business.id, email: business.ownerEmail },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      res.status(200).json({
        success: true,
        message: "Login successful.",
        token,
        business: {
          id: business.id,
          businessName: business.businessName,
          ownerName: business.ownerName,
          ownerEmail: business.ownerEmail,
          ownerPhone: business.ownerPhone,
          plan: business.plan,
          botActive: business.botActive,
          subscriptionActive: business.subscriptionActive,
          phoneNumberId: business.phoneNumberId,
          createdAt: business.createdAt,
        },
      });
    } catch (err: any) {
      console.error("[AuthController.login] Error:", err.message);
      res.status(500).json({
        success: false,
        error: "Something went wrong. Please try again.",
      });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const businessId = req.businessId!;

    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          businessName: true,
          ownerName: true,
          ownerEmail: true,
          ownerPhone: true,
          phoneNumberId: true,
          wabaId: true,
          location: true,
          deliveryInfo: true,
          paymentInfo: true,
          businessDescription: true,
          products: true,
          botActive: true,
          botPersonality: true,
          plan: true,
          trialEndsAt: true,
          subscriptionActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!business) {
        res.status(404).json({
          success: false,
          error: "Business account not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        business,
      });
    } catch (err: any) {
      console.error("[AuthController.getMe] Error:", err.message);
      res.status(500).json({
        success: false,
        error: "Something went wrong. Please try again.",
      });
    }
  }
}
