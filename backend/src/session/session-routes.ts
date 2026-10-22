import { Router } from "express";
import { requireAuth } from "../auth/auth-middleware";
import { validate } from "../shared/middleware/validate";
import {
  createSessionHandler,
  getSessionHandler,
  sendMessageHandler,
  submitHandler,
} from "./session-controller";
import { loadSession } from "./session-middleware";
import { sendMessageSchema, submitSchema } from "./session-validator";

export const sessionRouter = Router();

sessionRouter.use(requireAuth);
sessionRouter.post("/", createSessionHandler);
sessionRouter.get("/", loadSession, getSessionHandler);
sessionRouter.post("/messages", validate({ body: sendMessageSchema }), loadSession, sendMessageHandler);
sessionRouter.post("/submit", validate({ body: submitSchema }), loadSession, submitHandler);
