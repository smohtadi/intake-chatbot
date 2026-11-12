import { afterAll, beforeAll, beforeEach, inject } from "vitest";
import { connectDb, disconnectDb, resetDb } from "../src/shared/db";

beforeAll(async () => {
  await connectDb(inject("databaseUrl"));
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});
