import { Router } from "express";
import { requireAuth } from "../auth/auth-middleware";
import { validate } from "../shared/middleware/validate";
import { getHandler, listHandler, optionsHandler, updateHandler } from "./specialist-controller";
import { specialistParamsSchema, updateSpecialistSchema } from "./specialist-validator";

export const specialistRouter = Router();

specialistRouter.use(requireAuth);
specialistRouter.get("/", listHandler);
specialistRouter.get("/options", optionsHandler);
specialistRouter.get("/:id", validate({ params: specialistParamsSchema }), getHandler);
specialistRouter.put("/:id", validate({ params: specialistParamsSchema, body: updateSpecialistSchema }), updateHandler);
