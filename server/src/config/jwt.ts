import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates and retrieves the JWT secret from environment variables.
 * Fails fast with a clear fatal error if JWT_SECRET is not configured.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('FATAL: JWT_SECRET environment variable is missing or empty.');
  }
  return secret.trim();
};

/**
 * Standard token expiration duration for Sprint 1 (8 hours).
 */
export const JWT_EXPIRES_IN = '8h';
