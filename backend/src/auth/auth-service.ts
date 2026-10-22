import { randomBytes } from "node:crypto";
import { config } from "../config";
import { collection } from "../shared/db";
import { UnauthorizedError } from "../shared/errors";
import { verifyPassword } from "./auth-password";

export const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;

type AuthToken = { username: string; expiresAt: number };

const authTokens = () => collection<AuthToken>("authTokens");

/** Returns a new session token. Both checks always run so failures take the same time. */
export const login = async (username: string, password: string): Promise<string> => {
  const isPasswordValid = await verifyPassword(password, config.DEMO_PASSWORD_HASH);
  if (username !== config.DEMO_USERNAME || !isPasswordValid) {
    throw new UnauthorizedError("INVALID_CREDENTIALS");
  }
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  authTokens().set(token, { username, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
};

export const findUsernameByToken = (token: string | undefined): string => {
  const entry = token ? authTokens().get(token) : undefined;
  if (!token || !entry || entry.expiresAt <= Date.now()) {
    if (token) authTokens().delete(token);
    throw new UnauthorizedError();
  }
  return entry.username;
};

export const revokeToken = (token: string | undefined): void => {
  if (token) authTokens().delete(token);
};

export const deleteExpiredTokens = (now = Date.now()): void => {
  for (const [token, entry] of authTokens()) {
    if (entry.expiresAt <= now) authTokens().delete(token);
  }
};
