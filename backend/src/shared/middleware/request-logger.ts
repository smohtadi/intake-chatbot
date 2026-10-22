import type { NextFunction, Request, Response } from "express";

/** Logs method, path, status and timing only; never bodies, which hold message text. */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = performance.now();
  res.on("finish", () => {
    const durationMs = Math.round(performance.now() - startedAt);
    console.log(`${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`);
  });
  next();
};
