import { randomBytes, scrypt, timingSafeEqual, type BinaryLike } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: BinaryLike, salt: BinaryLike, keyLength: number) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_BYTES);
  const key = await scryptAsync(password, salt, KEY_BYTES);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const [, saltHex = "", keyHex = ""] = storedHash.split("$");
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
};
