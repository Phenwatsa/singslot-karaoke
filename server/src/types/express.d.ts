import { Role } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  sub: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
