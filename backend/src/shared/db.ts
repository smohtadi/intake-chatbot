/**
 * Database entry point — the ONLY file that knows which database is used.
 *
 * The template ships an in-memory store so it runs with zero setup. When a
 * project picks a real database, replace the bodies below (see README,
 * "Choosing a database") and rewrite the feature services to use it:
 *
 *   Mongo:  connectDb -> mongoose.connect(url), resetDb -> drop collections
 *   SQL:    connectDb -> create pool/Drizzle client, resetDb -> TRUNCATE tables
 */

const collections = new Map<string, Map<string, unknown>>();

/** In-memory placeholder for a table/collection. */
export const collection = <T>(name: string): Map<string, T> => {
  let store = collections.get(name);
  if (!store) {
    store = new Map<string, unknown>();
    collections.set(name, store);
  }
  return store as Map<string, T>;
};

export const connectDb = async (_url?: string): Promise<void> => {
  // In-memory: nothing to connect to.
};

export const disconnectDb = async (): Promise<void> => {
  collections.clear();
};

/** Wipes all data. Used between tests. */
export const resetDb = async (): Promise<void> => {
  for (const store of collections.values()) store.clear();
};
