import path from "node:path";
import express from "express";
import helmet from "helmet";
import { createAuthRouter } from "./auth/auth-routes";
import { config } from "./config";
import { sessionRouter } from "./session/session-routes";
import { errorHandler } from "./shared/middleware/error-handler";
import { notFound } from "./shared/middleware/not-found";
import { requestLogger } from "./shared/middleware/request-logger";

const serveFrontend = (app: express.Express, staticDir: string) => {
  const root = path.resolve(staticDir);
  app.use(express.static(root));
  app.get("*splat", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(root, "index.html"));
  });
};

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY);
  app.use(helmet());
  if (config.NODE_ENV !== "test") app.use(requestLogger);
  app.use(express.json({ limit: "10kb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", createAuthRouter());
  app.use("/api/session", sessionRouter);

  if (config.STATIC_DIR) serveFrontend(app, config.STATIC_DIR);

  app.all("*splat", notFound);
  app.use(errorHandler);

  return app;
};
