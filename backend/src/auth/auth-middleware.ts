import type { NextFunction, Request, Response } from "express";
import { findUsernameByToken } from "./auth-service";

export const AUTH_COOKIE = "token";

export type AuthLocals = { username: string };

export const readAuthCookie = (req: Request): string | undefined => {
  for (const pair of req.headers.cookie?.split(";") ?? []) {
    const [name, value] = pair.trim().split("=");
    if (name === AUTH_COOKIE) return value;
  }
  return undefined;
};

export const requireAuth = (req: Request, res: Response<unknown, AuthLocals>, next: NextFunction) => {
  res.locals.username = findUsernameByToken(readAuthCookie(req));
  next();
};
