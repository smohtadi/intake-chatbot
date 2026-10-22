import Axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { env } from "@/config/env-config";
import { emitToast } from "./toast-events";
import { emitUnauthorized } from "./auth-events";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Set when the caller shows the error itself, e.g. inline in the chat. */
    skipErrorToast?: boolean;
  }
}

const API_ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMITED: "Too many sign-in attempts. Please wait 15 minutes and try again.",
  LLM_ERROR: "The assistant is unavailable right now. Please try again.",
  TURN_LIMIT_REACHED: "This intake reached its message limit. Please start a new intake.",
  TURN_IN_PROGRESS: "Please wait for the assistant to reply.",
  SESSION_NOT_FOUND: "This intake has expired. Please start a new intake.",
  INTAKE_INCOMPLETE: "The intake is not complete yet.",
  ALREADY_SUBMITTED: "This intake was already submitted.",
};

export function getApiErrorMessage(title: unknown): string | undefined {
  return typeof title === "string" ? API_ERROR_MESSAGES[title] : undefined;
}

async function requestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = "application/json";
  }
  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
  // Send cookies with every request, which session-based auth needs. Token
  // auth can attach an Authorization header in requestInterceptor instead.
  withCredentials: true,
  // If the backend uses CSRF cookies, configure them here, e.g.:
  // withXSRFToken: true,
  // xsrfCookieName: "XSRF-TOKEN",
  // xsrfHeaderName: "X-XSRF-TOKEN",
});

api.interceptors.request.use(requestInterceptor);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // Auth state is owned by AuthProvider. A 401 is not shown as a toast;
    // ProtectedRoute renders its fallback once /me confirms the session ended.
    if (status === 401) {
      emitUnauthorized();
      return Promise.reject(error);
    }

    if (error.config?.skipErrorToast) return Promise.reject(error);

    const fallback = "An unexpected error occurred. Please try again.";
    const responseData = error.response?.data as
      | { title?: string; message?: string }
      | string
      | undefined;
    const message =
      typeof responseData === "string"
        ? responseData
        : getApiErrorMessage(responseData?.title) || responseData?.message || fallback;

    emitToast({
      message,
      status,
    });

    return Promise.reject(error);
  },
);
