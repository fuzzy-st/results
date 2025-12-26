/**
 * Examples demonstrating the usage of the createErrorBoundary method
 * from the Result pattern library.
 */

import { isError } from "~/lib/core/isError";
import { createErrorBoundary } from "~/lib/transformers/createErrorBoundary";
import { pipe } from "~/lib/transformers/pipe";
import type { Result } from "~/types";

/**
 * Example 1: Basic Error Boundary Usage
 *
 * Demonstrates the basic usage of createErrorBoundary for catching exceptions
 */
export function basicErrorBoundaryExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 1: Basic Error Boundary Usage");

  // Create a simple error boundary
  const simpleBoundary = createErrorBoundary((err) =>
    err instanceof Error ? err : new Error(String(err)),
  );

  // Successful operation
  const successResult = simpleBoundary(() => {
    console.log("Executing successful operation");
    return 42;
  });
  console.log("Success result:", successResult);

  // Failing operation
  const errorResult = simpleBoundary(() => {
    console.log("Executing failing operation");
    throw new Error("Something went wrong");
  });
  console.log("Error result:", errorResult);

  // Non-Error exception
  const stringErrorResult = simpleBoundary(() => {
    console.log("Throwing string exception");
    throw "Invalid state";
  });
  console.log("String error result:", stringErrorResult);

  // Object exception
  const objectErrorResult = simpleBoundary(() => {
    console.log("Throwing object exception");
    throw { code: 500, message: "Internal error" };
  });
  console.log("Object error result:", objectErrorResult);

  return { successResult, errorResult, stringErrorResult, objectErrorResult };
}

/**
 * Example 2: Domain-Specific Error Boundaries
 *
 * Shows how to create specialized error boundaries for different parts of an application
 */
export function domainSpecificBoundaryExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 2: Domain-Specific Error Boundaries");

  // Define custom error types
  class ApiError extends Error {
    constructor(
      public statusCode: number,
      message: string,
      public originalError?: Error,
    ) {
      super(message);
      this.name = "ApiError";
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

  class DatabaseError extends Error {
    constructor(
      public code: string,
      message: string,
      public query?: string,
    ) {
      super(message);
      this.name = "DatabaseError";
    }
  }

  // Create domain-specific error boundaries
  const apiBoundary = createErrorBoundary((err) => {
    console.log("API error transformer called");
    if (err instanceof Error) {
      return new ApiError(500, `API Error: ${err.message}`, err);
    }
    return new ApiError(400, `API Error: ${String(err)}`);
  });

  const validationBoundary = createErrorBoundary((err) => {
    console.log("Validation error transformer called");
    if (err instanceof Error) {
      return new ValidationError("unknown", err.message);
    }
    if (typeof err === "string") {
      const parts = err.split(":");
      if (parts.length > 1) {
        return new ValidationError(parts[0].trim(), parts[1].trim());
      }
    }
    return new ValidationError("unknown", String(err));
  });

  const dbBoundary = createErrorBoundary((err) => {
    console.log("DB error transformer called");
    if (err instanceof Error) {
      const message = err.message;

      // Extract SQL error code if available
      const codeMatch = message.match(/ERROR_CODE:(\w+)/);
      const code = codeMatch ? codeMatch[1] : "UNKNOWN";

      // Extract query if available
      const queryMatch = message.match(/QUERY:(.*?)(?:\s|$)/);
      const query = queryMatch ? queryMatch[1] : undefined;

      return new DatabaseError(code, message, query);
    }
    return new DatabaseError("UNKNOWN", String(err));
  });

  // Use domain-specific boundaries
  console.log("API Error Example:");
  const apiResult = apiBoundary(() => {
    throw new Error("Connection timeout");
  });
  console.log("API Result:", apiResult);
  if (isError(apiResult)) {
    console.log("Status code:", (apiResult.error as ApiError).statusCode);
  }

  console.log("\nValidation Error Example:");
  const validationResult = validationBoundary(() => {
    throw "email: Invalid email format";
  });
  console.log("Validation Result:", validationResult);
  if (isError(validationResult)) {
    console.log("Field:", (validationResult.error as ValidationError).field);
  }

  console.log("\nDatabase Error Example:");
  const dbResult = dbBoundary(() => {
    throw new Error(
      "ERROR_CODE:ER_DUP_ENTRY QUERY:INSERT INTO users VALUES ('duplicate') Duplicate entry",
    );
  });
  console.log("DB Result:", dbResult);
  if (isError(dbResult)) {
    const dbErr = dbResult.error as DatabaseError;
    console.log("Error code:", dbErr.code);
    console.log("Query:", dbErr.query);
  }

  return { apiResult, validationResult, dbResult };
}

/**
 * Example 3: Error Boundaries in Practical Scenarios
 *
 * Demonstrates using error boundaries in real-world application scenarios
 */
export function practicalBoundaryExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 3: Error Boundaries in Practical Scenarios");

  // Mock external system or library (imagine this is a third-party API or DOM API)
  interface ExternalSystemResponse {
    status: number;
    data: any;
  }

  const externalSystem = {
    sendRequest: (endpoint: string, data: any): ExternalSystemResponse => {
      // Simulate failures for specific endpoints
      if (endpoint === "/api/error") {
        throw new Error("External system error");
      }
      if (endpoint === "/api/timeout") {
        throw "Connection timeout";
      }
      if (endpoint === "/api/auth") {
        throw { code: 401, message: "Unauthorized" };
      }

      // Success case
      return {
        status: 200,
        data: { message: "Success", endpoint, receivedData: data },
      };
    },
  };

  // Define custom application error
  class AppError extends Error {
    constructor(
      public code: string,
      message: string,
      public details?: any,
      public originalError?: Error,
    ) {
      super(message);
      this.name = "AppError";
    }
  }

  // Create an error boundary for the external system
  const externalSystemBoundary = createErrorBoundary((err) => {
    if (err instanceof Error) {
      return new AppError(
        "EXTERNAL_ERROR",
        `External system error: ${err.message}`,
        undefined,
        err,
      );
    }

    if (typeof err === "object" && err !== null) {
      const code = (err as any).code || "UNKNOWN";
      const message = (err as any).message || "Unknown error";
      return new AppError(`EXTERNAL_${code}`, message, err);
    }

    return new AppError("EXTERNAL_UNKNOWN", `External system error: ${String(err)}`);
  });

  // Create a service that uses the external system
  class UserService {
    fetchUser(userId: string): Result<any, AppError> {
      return externalSystemBoundary(() => {
        console.log(`Fetching user ${userId}...`);
        return externalSystem.sendRequest("/api/users", { userId });
      });
    }

    updateUser(userId: string, data: any): Result<any, AppError> {
      return externalSystemBoundary(() => {
        console.log(`Updating user ${userId}...`);
        return externalSystem.sendRequest("/api/users/update", { userId, ...data });
      });
    }

    deleteUser(userId: string): Result<any, AppError> {
      return externalSystemBoundary(() => {
        console.log(`Deleting user ${userId}...`);
        // This will simulate an error
        return externalSystem.sendRequest("/api/error", { userId });
      });
    }

    authenticateUser(username: string, password: string): Result<any, AppError> {
      return externalSystemBoundary(() => {
        console.log(`Authenticating user ${username}...`);
        // This will simulate an auth error
        return externalSystem.sendRequest("/api/auth", { username, password });
      });
    }
  }

  // Use the service
  const userService = new UserService();

  console.log("Fetch user example:");
  const fetchResult = userService.fetchUser("user123");
  console.log("Fetch result:", fetchResult);

  console.log("\nUpdate user example:");
  const updateResult = userService.updateUser("user123", { name: "Updated Name" });
  console.log("Update result:", updateResult);

  console.log("\nDelete user example (will error):");
  const deleteResult = userService.deleteUser("user123");
  console.log("Delete result:", deleteResult);
  if (isError(deleteResult)) {
    const appErr = deleteResult.error;
    console.log("Error code:", appErr.code);
    console.log("Error details:", appErr.details);
    console.log("Original error:", appErr.originalError);
  }

  console.log("\nAuthenticate user example (will error):");
  const authResult = userService.authenticateUser("user", "password");
  console.log("Auth result:", authResult);
  if (isError(authResult)) {
    const appErr = authResult.error;
    console.log("Error code:", appErr.code);
    console.log("Error details:", appErr.details);
  }

  return { fetchResult, updateResult, deleteResult, authResult };
}

/**
 * Example 4: Combining Error Boundaries with Pipe
 *
 * Shows how to integrate error boundaries with transformation pipelines
 */
export function errorBoundaryWithPipeExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 4: Combining Error Boundaries with Pipe");

  // Define domain error
  class DomainError extends Error {
    constructor(
      public domain: string,
      public code: string,
      message: string,
    ) {
      super(message);
      this.name = `${domain}Error`;
    }
  }

  // Create domain-specific boundaries
  const parserBoundary = createErrorBoundary(
    (err) => new DomainError("Parser", "PARSE_ERROR", `Parsing error: ${err}`),
  );

  const validationBoundary = createErrorBoundary(
    (err) => new DomainError("Validation", "VALIDATION_ERROR", `Validation error: ${err}`),
  );

  const processorBoundary = createErrorBoundary(
    (err) => new DomainError("Processor", "PROCESSING_ERROR", `Processing error: ${err}`),
  );

  // Define processing steps that might throw
  function parseInput(input: string) {
    return parserBoundary(() => {
      console.log(`Parsing input: ${input}`);
      if (input.trim() === "") {
        throw new Error("Empty input");
      }

      try {
        return JSON.parse(input);
      } catch (e) {
        throw new Error(`Invalid JSON: ${e.message}`);
      }
    });
  }

  function validateData(data: any) {
    return validationBoundary(() => {
      console.log("Validating data:", data);

      if (!data || typeof data !== "object") {
        throw new Error("Expected an object");
      }

      if (!data.name || typeof data.name !== "string") {
        throw new Error("Missing or invalid 'name' field");
      }

      if (!data.age || typeof data.age !== "number") {
        throw new Error("Missing or invalid 'age' field");
      }

      return data;
    });
  }

  function processData(data: any) {
    return processorBoundary(() => {
      console.log("Processing data:", data);

      // Simulate some processing
      if (data.name === "error") {
        throw new Error("Processing error triggered by name");
      }

      return {
        id: Math.floor(Math.random() * 1000),
        name: data.name.toUpperCase(),
        age: data.age,
        processed: true,
        timestamp: new Date().toISOString(),
      };
    });
  }

  // Combine boundaries with pipe
  function processUserData(input: string) {
    return pipe(
      input,
      parseInput, // Might return error Result
      validateData, // Might return error Result
      processData, // Might return error Result
    );
  }

  // Test with various inputs
  console.log("Example 1: Valid input");
  const validResult = processUserData('{"name": "John", "age": 30}');
  console.log("Valid result:", validResult);

  console.log("\nExample 2: Empty input");
  const emptyResult = processUserData("");
  console.log("Empty result:", emptyResult);

  console.log("\nExample 3: Invalid JSON");
  const invalidJsonResult = processUserData("{not valid json}");
  console.log("Invalid JSON result:", invalidJsonResult);

  console.log("\nExample 4: Missing fields");
  const missingFieldsResult = processUserData('{"name": "Alice"}');
  console.log("Missing fields result:", missingFieldsResult);

  console.log("\nExample 5: Processing error");
  const processingErrorResult = processUserData('{"name": "error", "age": 25}');
  console.log("Processing error result:", processingErrorResult);

  // Compare domain-specific errors
  if (isError(emptyResult) && isError(invalidJsonResult)) {
    const parseError1 = emptyResult.error as DomainError;
    const parseError2 = invalidJsonResult.error as DomainError;

    console.log("\nComparing parse errors:");
    console.log("Empty input error domain:", parseError1.domain);
    console.log("Empty input error code:", parseError1.code);
    console.log("Invalid JSON error domain:", parseError2.domain);
    console.log("Invalid JSON error code:", parseError2.code);
  }

  if (isError(missingFieldsResult) && isError(processingErrorResult)) {
    const validationError = missingFieldsResult.error as DomainError;
    const processingError = processingErrorResult.error as DomainError;

    console.log("\nComparing other errors:");
    console.log("Validation error domain:", validationError.domain);
    console.log("Validation error code:", validationError.code);
    console.log("Processing error domain:", processingError.domain);
    console.log("Processing error code:", processingError.code);
  }

  return {
    validResult,
    emptyResult,
    invalidJsonResult,
    missingFieldsResult,
    processingErrorResult,
  };
}

// Run all examples
function _runCreateErrorBoundaryExamples() {
  basicErrorBoundaryExamples();
  domainSpecificBoundaryExamples();
  practicalBoundaryExamples();
  errorBoundaryWithPipeExample();
}

// Uncomment to run
// runCreateErrorBoundaryExamples();
