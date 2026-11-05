export type Role = 'CUSTOMER' | 'STAFF';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string | null;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}
