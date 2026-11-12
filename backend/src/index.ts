import { createApp } from "./app";
import { deleteExpiredTokens } from "./auth/auth-service";
import { config } from "./config";
import { connectDb, disconnectDb } from "./shared/db";
import { embedMissingSpecialists } from "./specialist/specialist-service";

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

const start = async () => {
  await connectDb(config.DATABASE_URL);
  embedMissingSpecialists().catch((error: unknown) => {
    console.error("Embedding specialists failed:", error instanceof Error ? error.message : error);
  });

  const server = createApp().listen(config.PORT);

  const cleanupTimer = setInterval(deleteExpiredTokens, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref();

  const shutdown = () => {
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
