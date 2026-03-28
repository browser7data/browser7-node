/**
 * Browser7 SDK Error Classes
 *
 * Hierarchy:
 *   Browser7Error (base)          — network errors, 404, 500+, constructor validation
 *   ├── AuthenticationError       — 401, 403
 *   ├── ValidationError           — 400
 *   ├── RateLimitError            — 429
 *   ├── InsufficientBalanceError  — 402
 *   └── RenderError               — 422 (failed render), render() failure/timeout
 */

class Browser7Error extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number|null} [statusCode=null] - HTTP status code (null for network/timeout errors)
   * @param {object|null} [body=null] - Parsed JSON response body (null for network errors)
   */
  constructor(message, statusCode = null, body = null) {
    super(message);
    this.name = 'Browser7Error';
    this.statusCode = statusCode;
    this.body = body;
  }
}

class AuthenticationError extends Browser7Error {
  constructor(message, statusCode = null, body = null) {
    super(message, statusCode, body);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends Browser7Error {
  constructor(message, statusCode = null, body = null) {
    super(message, statusCode, body);
    this.name = 'ValidationError';
  }

  /** @returns {Array|null} Validation error details from the API response */
  get details() {
    return this.body?.details ?? null;
  }
}

class RateLimitError extends Browser7Error {
  constructor(message, statusCode = null, body = null) {
    super(message, statusCode, body);
    this.name = 'RateLimitError';
  }

  /** @returns {number|null} Maximum concurrent requests allowed */
  get concurrentLimit() {
    const match = this.message.match(/Maximum allowed:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}

class InsufficientBalanceError extends Browser7Error {
  constructor(message, statusCode = null, body = null) {
    super(message, statusCode, body);
    this.name = 'InsufficientBalanceError';
  }
}

class RenderError extends Browser7Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number|null} [statusCode=null] - HTTP status code
   * @param {object|null} [body=null] - Parsed JSON response body
   * @param {string|null} [errorCode=null] - API error code (e.g., 'NETWORK_ERROR', 'RENDER_TIMEOUT')
   * @param {string|null} [renderId=null] - The render ID
   * @param {boolean|null} [billable=null] - Whether the render was charged
   */
  constructor(message, statusCode = null, body = null, errorCode = null, renderId = null, billable = null) {
    super(message, statusCode, body);
    this.name = 'RenderError';
    this.errorCode = errorCode;
    this.renderId = renderId;
    this.billable = billable;
  }
}

export {
  Browser7Error,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  InsufficientBalanceError,
  RenderError
};
