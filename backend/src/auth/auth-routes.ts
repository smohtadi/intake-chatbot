import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { TooManyRequestsError } from "../shared/errors";
import { validate } from "../shared/middleware/validate";
import { loginHandler, logoutHandler, meHandler } from "./auth-controller";
import { requireAuth } from "./auth-middleware";
import { loginSchema } from "./auth-validator";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPTS = 5;

/** A factory so each app instance (and each test) gets its own rate-limit counters. */
export const createAuthRouter = () => {
  const loginLimiter = rateLimit({
    windowMs: LOGIN_WINDOW_MS,
    limit: LOGIN_ATTEMPTS,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new TooManyRequestsError()),
  });

  const authRouter = Router();
  authRouter.post("/login", loginLimiter, validate({ body: loginSchema }), loginHandler);
  authRouter.post("/logout", logoutHandler);
  authRouter.get("/me", requireAuth, meHandler);
  return authRouter;
};
