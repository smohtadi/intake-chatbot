import type { NextFunction, Request, Response } from "express";
import type { AuthLocals } from "../auth/auth-middleware";
import { getSessionByOwner, type Session } from "./session-service";

export type SessionLocals = AuthLocals & { session: Session };

/** Loads the signed-in user's session into res.locals.session, or responds 404. */
export const loadSession = (_req: Request, res: Response<unknown, SessionLocals>, next: NextFunction) => {
  res.locals.session = getSessionByOwner(res.locals.username);
  next();
};
