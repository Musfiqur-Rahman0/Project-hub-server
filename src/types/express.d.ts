export interface SessionUser {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      cookies?: Record<string, string>;
    }
  }
}
