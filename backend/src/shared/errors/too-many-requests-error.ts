import { AppError } from "./app-error";

export class TooManyRequestsError extends AppError {
  readonly statusCode = 429;

  constructor(message = "RATE_LIMITED") {
    super(message);
  }
}
