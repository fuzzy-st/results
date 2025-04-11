/**
 * Examples demonstrating the usage of the error method
 * from the Result pattern library.
 */

import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

/**
 * Example 1: Basic Error Creation
 * 
 * Demonstrates creating error results with different types of errors
 */
export function basicErrorExamples() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 1: Basic Error Creation");

    // Create an error with a standard Error
    const standardError = error(new Error("Something went wrong"));
    console.log("Standard Error:", standardError);
    // Output: { status: "error", error: Error("Something went wrong") }

    // Create an error with a custom error type
    class ValidationError extends Error {
        constructor(message: string) {
            super(message);
            this.name = "ValidationError";
        }
    }
    const customError = error(new ValidationError("Invalid input"));
    console.log("Custom Error:", customError);
    // Output: { status: "error", error: ValidationError("Invalid input") }

    // Create an error with a primitive value
    const primitiveError = error("Connection failed");
    console.log("Primitive Error:", primitiveError);
    // Output: { status: "error", error: "Connection failed" }

    return { standardError, customError, primitiveError };
}

/**
 * Example 2: Error Handling in Validation
 * 
 * Shows how error can be used in validation scenarios
 */
export function validationErrorExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 2: Validation Error");

    // Validation function that returns either a success or an error
    function validateEmail(email: string): Result<string, Error> {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            return error(new Error("Email cannot be empty"));
        }

        if (!emailRegex.test(email)) {
            return error(new Error("Invalid email format"));
        }

        return success(email);
    }

    // Test valid email
    const validEmail = validateEmail("user@example.com");
    console.log("Valid Email Result:", validEmail);

    // Test invalid email
    const invalidEmail = validateEmail("invalid-email");
    console.log("Invalid Email Result:", invalidEmail);

    return { validEmail, invalidEmail };
}

/**
 * Example 3: Error in Async Operations
 * 
 * Demonstrates error handling in asynchronous contexts
 */
export async function asyncErrorExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 3: Async Error Handling");

    // Simulated async operation that can fail
    async function fetchUserData(userId: number): Promise<Result<{ name: string }, Error>> {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 100));

        if (userId <= 0) {
            return error(new Error("Invalid user ID"));
        }

        // Successful case
        return success({ name: "John Doe" });
    }

    // Test with valid user ID
    const validUserResult = await fetchUserData(42);
    console.log("Valid User Result:", validUserResult);

    // Test with invalid user ID
    const invalidUserResult = await fetchUserData(-1);
    console.log("Invalid User Result:", invalidUserResult);

    return { validUserResult, invalidUserResult };
}

/**
 * Example 4: Error with Complex Error Objects
 * 
 * Shows how to create errors with additional context
 */
// Custom error with additional context
interface DatabaseError extends Error {
    code: number;
    context?: Record<string, unknown>;
}
export function complexErrorExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 4: Complex Error Objects");


    // Custom error with additional context
    class DatabaseError extends Error {
        code: number;
        context?: Record<string, unknown>;

        constructor(message: string, code: number, context?: Record<string, unknown>) {
            super(message);
            this.name = "DatabaseError";
            this.code = code;
            this.context = context;
        }
    }
    // Let typescript infer the return type 
    function performDatabaseOperation(data: unknown) {
        if (!data) {
            return error(new DatabaseError(
                "Empty data provided",
                400,
                {
                    timestamp: new Date(),
                    operation: "insert"
                }
            ));
        }

        // Successful operation
        return success(data);
    }

    // Test with empty data
    const emptyDataError = performDatabaseOperation(null);
    console.log("Empty Data Error:", emptyDataError);

    // Test with valid data
    const validDataResult = performDatabaseOperation({ id: 1 });
    console.log("Valid Data Result:", validDataResult);

    return { emptyDataError, validDataResult };
}

// Run all examples
async function runExamples() {
    basicErrorExamples();
    validationErrorExample();
    await asyncErrorExample();
    complexErrorExample();
}

// Uncomment to run
// await runExamples();