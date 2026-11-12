import { AppError, type SerializedError } from "./app-error";

/** A 400 for one field that passed schema validation but was rejected later, e.g. an unknown id. */
export class InvalidFieldError extends AppError {
  readonly statusCode = 400;

  constructor(
    private readonly path: string,
    private readonly detail: string,
  ) {
    super("VALIDATION_ERROR");
  }

  override serialize(): SerializedError {
    return { status: this.statusCode, title: this.message, errors: [{ path: this.path, message: this.detail }] };
  }
}
