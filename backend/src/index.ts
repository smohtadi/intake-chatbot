import { createApp } from "./app";
import { deleteExpiredTokens } from "./auth/auth-service";
import { config } from "./config";
import { deleteIdleSessions } from "./session/session-service";
import { connectDb, disconnectDb } from "./shared/db";

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

const start = async () => {
  await connectDb(config.DATABASE_URL);

  const server = createApp().listen(config.PORT, () => {
    console.log(`Listening on port ${config.PORT} (${config.NODE_ENV})`);
  });

  const cleanupTimer = setInterval(() => {
    deleteIdleSessions();
    deleteExpiredTokens();
  }, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref();

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    clearInterval(cleanupTimer);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
