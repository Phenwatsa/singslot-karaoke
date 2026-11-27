import { Request, Response, NextFunction } from 'express';
import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { getJwtSecret, JWT_EXPIRES_IN } from '../config/jwt';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register (FR-12, AC-12, NFR-01)
 * Public customer self-registration endpoint.
 * Strictly assigns Role.CUSTOMER and hashes password with bcrypt (10 rounds).
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, fullName, phone } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof fullName !== 'string' ||
      !EMAIL_REGEX.test(email.trim().toLowerCase()) ||
      password.length < 8 ||
      fullName.trim().length === 0 ||
      (phone !== undefined && phone !== null && typeof phone !== 'string')
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Valid email, fullName, and password (minimum 8 characters) are required.'
        }
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    const normalizedPhone = typeof phone === 'string' && phone.trim().length > 0 ? phone.trim() : null;

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email already exists.'
        }
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const created = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: normalizedName,
          phone: normalizedPhone,
          role: Role.CUSTOMER
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true
        }
      });

      res.status(201).json({
        success: true,
        user: created
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'An account with this email already exists.'
          }
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Validates seeded credentials and issues an 8-hour JWT token.
 * Conforms to AC-01 and AC-01a.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    // Sign JWT using centralized secret and 8-hour expiration
    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return token and user identity without passwordHash (NFR-01)
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Acknowledges session termination for caller.
 * Conforms to AC-01e.
 */
export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns authenticated caller's identity without password hash.
 * Conforms to AC-01d.
 */
export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User account not found'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
