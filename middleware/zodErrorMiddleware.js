import { ZodError } from "zod";

// This is your middleware
export const zodErrorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    // err.errors is always an array in ZodError, but safer to check
    const zodErrors = Array.isArray(err.errors) ? err.errors : [];

    const errors = {};

    zodErrors.forEach((e) => {
      const field = e.path?.[0] || "unknown"; // safety
      const message = e.message || "Invalid input";
      errors[field] = message;
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors, // ✅ frontend-friendly
    });
  }

  next(err); // pass to next error handler
};
