import { AppError } from "./app-error";

export class BadGatewayError extends AppError {
  readonly statusCode = 502;

  constructor(message = "BAD_GATEWAY") {
    super(message);
  }
}
