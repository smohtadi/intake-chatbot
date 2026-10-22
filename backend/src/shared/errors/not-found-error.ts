import { AppError } from "./app-error";

export class NotFoundError extends AppError {
  readonly statusCode = 404;

  constructor(message = "NOT_FOUND") {
    super(message);
  }
}
