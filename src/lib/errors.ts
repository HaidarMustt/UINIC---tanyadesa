// Errors that the API is allowed to show to users.
// Anything else is treated as an internal error and hidden behind a generic message.

export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super(429, message);
    this.name = "RateLimitError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(503, message);
    this.name = "ServiceUnavailableError";
  }
}
