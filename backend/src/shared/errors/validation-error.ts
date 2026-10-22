import type { ZodError } from "zod";
import { AppError, type SerializedError } from "./app-error";

export class ValidationError extends AppError {
  readonly statusCode = 400;

  constructor(
    private readonly zodError: ZodError,
    private readonly location: "body" | "params" | "query",
  ) {
    super("VALIDATION_ERROR");
  }

  override serialize(): SerializedError {
    return {
      status: this.statusCode,
      title: this.message,
      errors: this.zodError.issues.map((issue) => ({
        path: [this.location, ...issue.path].join("."),
        message: issue.message,
      })),
    };
  }
}
