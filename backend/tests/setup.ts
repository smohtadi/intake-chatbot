import { afterAll, beforeAll, beforeEach } from "vitest";
import { connectDb, disconnectDb, resetDb } from "../src/shared/db";

// The only test file that changes when you switch databases.
// See README "Choosing a database" for Mongo/Postgres testcontainers versions.
beforeAll(async () => {
  await connectDb();
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});
