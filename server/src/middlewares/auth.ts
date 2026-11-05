import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { getJwtSecret } from '../config/jwt';

/**
 * Middleware to verify JWT authentication token from Authorization header.
 * Conforms to AC-01b: Missing or invalid token yields HTTP 401 with code UNAUTHENTICATED.
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required'
      }
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      id: decoded.sub || decoded.id,
      sub: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded.role as Role
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Invalid or expired authentication token'
      }
    });
  }
};

/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 * Conforms to AC-01c: Unprivileged callers yield HTTP 403 with code FORBIDDEN.
 */
export const requireRole = (allowedRoles: Role | Role[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction): void => {
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

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: insufficient permissions'
        }
      });
      return;
    }

    next();
  };
};

export const requireStaff = requireRole(Role.STAFF);
