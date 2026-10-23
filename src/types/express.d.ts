import type { Role } from "../generated/enums.js";

export interface SessionUser {
  userId: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      cookies?: Record<string, string>;
    }
  }
}
