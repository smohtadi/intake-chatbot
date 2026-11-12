import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAuth } from "../auth/auth-middleware";
import { TooManyRequestsError } from "../shared/errors";
import { validate } from "../shared/middleware/validate";
import { associateHandler, matchHandler } from "./match-controller";
import { associateSchema, matchSchema } from "./match-validator";

export const MATCH_WINDOW_MS = 10 * 60 * 1000;
export const MATCH_REQUESTS_PER_WINDOW = 20;

/** A factory so each app instance (and each test) gets its own rate-limit counters. */
export const createMatchRouter = () => {
  const matchLimiter = rateLimit({
    windowMs: MATCH_WINDOW_MS,
    limit: MATCH_REQUESTS_PER_WINDOW,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new TooManyRequestsError()),
  });

  const matchRouter = Router();
  matchRouter.use(requireAuth, matchLimiter);
  matchRouter.post("/", validate({ body: matchSchema }), matchHandler);
  matchRouter.post("/associate", validate({ body: associateSchema }), associateHandler);
  return matchRouter;
};
