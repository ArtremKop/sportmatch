import { NextFunction, Request, Response } from "express";
import { ApiError } from "../httpError";
import { verifyAccess } from "../lib/tokens";

export type AuthedRequest = Request & { userId: string };

export function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Not logged in"));
  }
  try {
    (req as AuthedRequest).userId = verifyAccess(header.slice(7));
    next();
  } catch {
    next(new ApiError(401, "Session expired"));
  }
}
