import type { CookieOptions, Request, Response } from "express";
import { config } from "../config";
import { AUTH_COOKIE, readAuthCookie, type AuthLocals } from "./auth-middleware";
import { login, revokeToken, TOKEN_TTL_MS } from "./auth-service";
import type { LoginInput } from "./auth-validator";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: config.NODE_ENV === "production",
  path: "/",
};

export const loginHandler = async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
  const token = await login(req.body.username, req.body.password);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: TOKEN_TTL_MS });
  res.status(200).json({ username: req.body.username });
};

export const logoutHandler = (req: Request, res: Response) => {
  revokeToken(readAuthCookie(req));
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.status(204).send();
};

export const meHandler = (_req: Request, res: Response<unknown, AuthLocals>) => {
  res.status(200).json({ username: res.locals.username });
};
