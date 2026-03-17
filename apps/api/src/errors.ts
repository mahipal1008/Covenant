/**
 * Domain-specific error hierarchy — Session 9 review §8.
 *
 * Replaces the scattered `throw new Error("...")` calls so callers can
 * pattern-match on `instanceof` and Fastify's error serializer can map
 * the `statusCode` directly to an HTTP response.
 *
 * Each class fixes a `statusCode` so handlers don't have to reach for
 * `@fastify/sensible` for the common cases. Existing string errors keep
 * working — adopt incrementally.
 */

export class CovenantError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = "covenant_error") {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class InvalidInputError extends CovenantError {
  constructor(message: string) {
    super(message, 400, "invalid_input");
  }
}

export class TenantMismatchError extends CovenantError {
  constructor(message = "tenant mismatch") {
    super(message, 403, "tenant_mismatch");
  }
}

export class NotFoundError extends CovenantError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "not_found");
  }
}

export class ConflictError extends CovenantError {
  constructor(message: string) {
    super(message, 409, "conflict");
  }
}

export class RateLimitedError extends CovenantError {
  constructor(message = "rate limited") {
    super(message, 429, "rate_limited");
  }
}

export class UnauthorizedError extends CovenantError {
  constructor(message = "unauthorized") {
    super(message, 401, "unauthorized");
  }
}

export class ForbiddenError extends CovenantError {
  constructor(message = "forbidden") {
    super(message, 403, "forbidden");
  }
}
