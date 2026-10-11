export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404); }
}

export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409); }
}

export class ForbiddenError extends AppError {
  constructor(message: string) { super(message, 403); }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) { super(message, 401); }
}
