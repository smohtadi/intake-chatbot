import { readFile } from "node:fs/promises";
import path from "node:path";
import { runner } from "node-pg-migrate";
import { Pool, type PoolClient } from "pg";

/**
 * Database entry point — the ONLY file that knows the database driver.
 * PostgreSQL with pgvector; migrations in `backend/migrations` run on connect.
 */

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");
const SEED_FILE = path.join(MIGRATIONS_DIR, "002_seed.sql");
const POOL_SIZE = 5;

let pool: Pool | undefined;

export const db = (): Pool => {
  if (!pool) throw new Error("Database is not connected");
  return pool;
};

export const connectDb = async (url: string): Promise<void> => {
  pool = new Pool({ connectionString: url, max: POOL_SIZE });
  const client = await pool.connect();
  try {
    await runner({
      dbClient: client,
      dir: MIGRATIONS_DIR,
      direction: "up",
      migrationsTable: "pgmigrations",
      log: () => {},
    });
  } finally {
    client.release();
  }
};

export const disconnectDb = async (): Promise<void> => {
  await pool?.end();
  pool = undefined;
};

/** Runs `work` in one transaction and rolls back if it throws. */
export const transaction = async <T>(work: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/** Restores the seed data. Used between tests. */
export const resetDb = async (): Promise<void> => {
  await db().query("TRUNCATE specialist, role, session_format, areas_practice, credentials CASCADE");
  await db().query(await readFile(SEED_FILE, "utf8"));
};
