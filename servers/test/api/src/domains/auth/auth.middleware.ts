import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./auth.service.js";

declare global {
  // Express's own module-augmentation pattern requires a namespace here;
  // no ESM equivalent exists for extending an ambient global interface.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) {
    res.status(401).json({ error: { message: "Not authenticated.", code: "UNAUTHENTICATED" } });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.sessionId = payload.sid;
    next();
  } catch {
    res.status(401).json({ error: { message: "Not authenticated.", code: "UNAUTHENTICATED" } });
  }
}
