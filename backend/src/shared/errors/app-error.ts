export interface ErrorDetail {
  path: string;
  message: string;
}

export interface SerializedError {
  status: number;
  title: string;
  errors?: ErrorDetail[];
}

/**
 * Base class for every error that should reach the client with a specific
 * status code. Anything else thrown is treated as a 500 by the error handler.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;

  serialize(): SerializedError {
    return { status: this.statusCode, title: this.message };
  }
}
