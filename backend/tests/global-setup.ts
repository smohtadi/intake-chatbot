import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

/** Starts one pgvector container for the whole run. */
export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer("pgvector/pgvector:pg17").start();
  project.provide("databaseUrl", container.getConnectionUri());
  return async () => {
    await container.stop();
  };
}
