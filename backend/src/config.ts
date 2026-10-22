import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().optional(),
  DEMO_USERNAME: z.string().min(1),
  DEMO_PASSWORD_HASH: z.string().regex(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/, "Run npm run hash-password"),
  ANTHROPIC_API_KEY: z.string().min(1),
  LLM_MODEL: z.string().min(1).default("claude-haiku-5-5"),
  STATIC_DIR: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", z.treeifyError(parsed.error));
  process.exit(1);
}

export const config = parsed.data;
