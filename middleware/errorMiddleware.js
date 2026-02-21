
import ErrorHanlder from "../utils/errorHandler.js";

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (res.headersSent) {
    return next(err); // Pass to default Express error handler
  }
  // Default to 500 if no statusCode set
  const statusCode = error.statusCode || 500;

  // Handle specific MongoDB or validation errors (optional)
  if (err.name === "CastError") {
    const message = `Resource not found with id ${err.value}`;
    error = new ErrorHanlder(message, 404);
  }

  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new ErrorHanlder(message, 400);
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map(val => val.message).join(", ");
    error = new ErrorHanlder(message, 400);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || "Server Error",
  });
};

export default errorHandler;
