/**
 * Examples demonstrating the usage of the mapError method
 * from the Result pattern library.
 */

import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import { mapError } from "~/lib/transformers/mapError";

/**
 * Example 1: Basic Error Transformation
 *
 * Demonstrates how to transform error values using mapError
 */
export function basicMapErrorExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 1: Basic Error Transformation");

  // Transform a standard Error to a more descriptive one
  const errorResult = error(new Error("Database connection failed"));
  const enhancedErrorResult = mapError(
    errorResult,
    (err) => new Error(`Critical error: ${err.message}. Please try again later.`),
  );
  console.log("Original Error Result:", errorResult);
  console.log("Enhanced Error Result:", enhancedErrorResult);

  // Transform to a custom error message string
  const stringErrorResult = mapError(errorResult, (err) => err.message);
  console.log("String Error Result:", stringErrorResult);

  // Success results pass through unchanged
  const successResult = success(42);
  const mappedSuccessResult = mapError(successResult, (_err) => new Error("This won't happen"));
  console.log("Original Success Result:", successResult);
  console.log("Mapped Success Result:", mappedSuccessResult);

  return {
    errorResult,
    enhancedErrorResult,
    stringErrorResult,
    successResult,
    mappedSuccessResult,
  };
}

/**
 * Example 2: Custom Error Types
 *
 * Shows how to use mapError with custom error classes
 */
export function customErrorTypeExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 2: Custom Error Types");

  // Define custom error classes
  class DatabaseError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message);
      this.name = "DatabaseError";
    }
  }

  class ValidationError extends Error {
    constructor(
      public field: string,
      message: string,
    ) {
      super(message);
      this.name = "ValidationError";
    }
  }

  class UserFacingError extends Error {
    constructor(
      public userMessage: string,
      public originalError: Error,
    ) {
      super(originalError.message);
      this.name = "UserFacingError";
    }
  }

  // Create Results with different error types
  const dbError = error(new DatabaseError("CONNECTION_FAILED", "Failed to connect to database"));
  const validationError = error(new ValidationError("email", "Invalid email format"));

  // Transform to user-friendly errors
  const userDbError = mapError(dbError, (err) => {
    if (err instanceof DatabaseError) {
      return new UserFacingError(
        "We're experiencing technical difficulties. Please try again later.",
        err,
      );
    }
    return new UserFacingError("An unknown error occurred", err);
  });

  const userValidationError = mapError(validationError, (err) => {
    if (err instanceof ValidationError) {
      return new UserFacingError(`Please check the ${err.field} field and try again.`, err);
    }
    return new UserFacingError("Please check your input and try again", err);
  });

  console.log("Database Error:", dbError);
  console.log("User-facing Database Error:", userDbError);
  console.log("Validation Error:", validationError);
  console.log("User-facing Validation Error:", userValidationError);

  return { dbError, userDbError, validationError, userValidationError };
}

// Define error categories
type ErrorCategory = "network" | "validation" | "authentication" | "internal" | "unknown";
/**
 * Example 3: Error Classification and Normalization
 *
 * Demonstrates using mapError to classify and normalize errors
 */
export function errorClassificationExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 3: Error Classification and Normalization");

  // Create various error results
  const networkErrorResult = error(new Error("network connection failed"));
  const validationErrorResult = error(new Error("invalid email format"));
  const authErrorResult = error(new Error("authentication token expired"));
  const internalErrorResult = error(new Error("internal server error"));
  const randomErrorResult = error(new Error("something went wrong"));

  // Normalize all errors to a consistent format
  const normalizedNetworkError = mapError(networkErrorResult, normalizeError);
  const normalizedValidationError = mapError(validationErrorResult, normalizeError);
  const normalizedAuthError = mapError(authErrorResult, normalizeError);
  const normalizedInternalError = mapError(internalErrorResult, normalizeError);
  const normalizedRandomError = mapError(randomErrorResult, normalizeError);

  console.log("Network Error Result:", networkErrorResult);
  console.log("Normalized Network Error:", normalizedNetworkError);

  console.log("Validation Error Result:", validationErrorResult);
  console.log("Normalized Validation Error:", normalizedValidationError);

  console.log("Auth Error Result:", authErrorResult);
  console.log("Normalized Auth Error:", normalizedAuthError);

  console.log("Internal Error Result:", internalErrorResult);
  console.log("Normalized Internal Error:", normalizedInternalError);

  console.log("Random Error Result:", randomErrorResult);
  console.log("Normalized Random Error:", normalizedRandomError);

  return {
    networkErrorResult,
    normalizedNetworkError,
    validationErrorResult,
    normalizedValidationError,
    authErrorResult,
    normalizedAuthError,
    internalErrorResult,
    normalizedInternalError,
    randomErrorResult,
    normalizedRandomError,
  };
}

/**
 * Example 4: Practical Error Handling in API Calls
 *
 * Shows how to use mapError in a real-world API calling scenario
 */
export function apiErrorHandlingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 4: Practical Error Handling in API Calls");

  // Define API-specific error types
  class ApiError extends Error {
    constructor(
      public statusCode: number,
      message: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  }

  class NotFoundError extends ApiError {
    constructor(resource: string) {
      super(404, `Resource not found: ${resource}`);
      this.name = "NotFoundError";
    }
  }

  class AuthorizationError extends ApiError {
    constructor(message: string) {
      super(401, message);
      this.name = "AuthorizationError";
    }
  }

  class ServerError extends ApiError {
    constructor() {
      super(500, "Internal server error");
      this.name = "ServerError";
    }
  }

  // Simulated API responses (as Results)
  const notFoundResponse = error(new ApiError(404, "User not found"));
  const unauthorizedResponse = error(new ApiError(401, "Invalid API key"));
  const serverErrorResponse = error(new ApiError(500, "Database query failed"));
  const successResponse = success({ id: 123, name: "John Doe" });

  // Transform API errors to domain-specific errors
  function transformApiError(apiError: Error): Error {
    if (!(apiError instanceof ApiError)) {
      return apiError; // Not an API error, return as is
    }

    switch (apiError.statusCode) {
      case 404:
        return new NotFoundError(apiError.message.replace("not found", "").trim());
      case 401:
      case 403:
        return new AuthorizationError(apiError.message);
      case 500:
        return new ServerError();
      default:
        return apiError;
    }
  }

  // Apply the transformation
  const transformedNotFound = mapError(notFoundResponse, transformApiError);
  const transformedUnauthorized = mapError(unauthorizedResponse, transformApiError);
  const transformedServerError = mapError(serverErrorResponse, transformApiError);
  // Success results pass through unchanged
  const transformedSuccess = mapError(successResponse, transformApiError);

  console.log("Not Found API Response:", notFoundResponse);
  console.log("Transformed Not Found:", transformedNotFound);

  console.log("Unauthorized API Response:", unauthorizedResponse);
  console.log("Transformed Unauthorized:", transformedUnauthorized);

  console.log("Server Error API Response:", serverErrorResponse);
  console.log("Transformed Server Error:", transformedServerError);

  console.log("Success API Response:", successResponse);
  console.log("Transformed Success (unchanged):", transformedSuccess);

  return {
    notFoundResponse,
    transformedNotFound,
    unauthorizedResponse,
    transformedUnauthorized,
    serverErrorResponse,
    transformedServerError,
    successResponse,
    transformedSuccess,
  };
}

// Run all examples
function _runMapErrorExamples() {
  basicMapErrorExamples();
  customErrorTypeExamples();
  errorClassificationExamples();
  apiErrorHandlingExample();
}

// Uncomment to run
// runMapErrorExamples();
interface NormalizedError {
  category: ErrorCategory;
  message: string;
  originalError: Error;
}
// Normalize different types of errors to a consistent format
function normalizeError(err: Error): NormalizedError {
  // Classify based on error message or type
  if (err.message.includes("network") || err.message.includes("connection")) {
    return {
      category: "network",
      message: "A network error occurred. Please check your internet connection.",
      originalError: err,
    };
  }
  if (err.message.includes("invalid") || err.message.includes("validation")) {
    return {
      category: "validation",
      message: "The provided data is invalid. Please check your input.",
      originalError: err,
    };
  }
  if (
    err.message.includes("auth") ||
    err.message.includes("login") ||
    err.message.includes("permission")
  ) {
    return {
      category: "authentication",
      message: "Authentication failed. Please sign in again.",
      originalError: err,
    };
  }
  if (err.name === "InternalError" || err.message.includes("internal")) {
    return {
      category: "internal",
      message: "An internal error occurred. Our team has been notified.",
      originalError: err,
    };
  }
  return {
    category: "unknown",
    message: "An unexpected error occurred. Please try again later.",
    originalError: err,
  };
}
