import { env } from "@/config/env-config";

export const baseUrl = (str = "") => env.API_URL + str;
