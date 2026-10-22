import { z } from "zod";
import { SCHEMA_ERRORS } from "@/schemas/schema-errors";

export const authUserSchema = z.object({
  username: z.string(),
});

export type IAuthUser = z.infer<typeof authUserSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, SCHEMA_ERRORS.REQUIRED),
  password: z.string().min(1, SCHEMA_ERRORS.REQUIRED),
});

export type ILoginForm = z.infer<typeof loginSchema>;
