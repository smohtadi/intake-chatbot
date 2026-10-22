import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.serialize());
  }

  // Malformed JSON bodies are rejected by express.json() with a 400.
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    return res.status(400).json({ status: 400, title: "INVALID_JSON" });
  }

  console.error(err);
  res.status(500).json({ status: 500, title: "INTERNAL_SERVER_ERROR" });
};
