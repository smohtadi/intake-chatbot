import { AppError } from "./app-error";

export class ConflictError extends AppError {
  readonly statusCode = 409;

  constructor(message = "CONFLICT") {
    super(message);
  }
}
