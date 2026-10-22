import { AppError } from "./app-error";

export class BadRequestError extends AppError {
  readonly statusCode = 400;

  constructor(message = "BAD_REQUEST") {
    super(message);
  }
}
