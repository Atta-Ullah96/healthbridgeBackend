
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Capture stack trace for debugging (optional)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler