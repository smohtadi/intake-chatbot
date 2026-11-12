import path from "node:path";
import express from "express";
import helmet from "helmet";
import { createAuthRouter } from "./auth/auth-routes";
import { config } from "./config";
import { createMatchRouter } from "./match/match-routes";
import { errorHandler } from "./shared/middleware/error-handler";
import { notFound } from "./shared/middleware/not-found";
import { specialistRouter } from "./specialist/specialist-routes";

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
  app.use(express.json({ limit: "32kb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", createAuthRouter());
  app.use("/api/match", createMatchRouter());
  app.use("/api/specialists", specialistRouter);

  if (config.STATIC_DIR) serveFrontend(app, config.STATIC_DIR);

  app.all("*splat", notFound);
  app.use(errorHandler);

  return app;
};
