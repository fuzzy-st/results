/**
 * Examples demonstrating the usage of the tapError method
 * from the Result pattern library.
 */

import { tapError } from "~/lib/transformers/tapError";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";
import { map } from "~/lib/transformers/map";
import { chain } from "~/lib/transformers/chain";
import type { Result } from "~/types";

/**
 * Example 1: Basic TapError Usage
 * 
 * Demonstrates the basic usage of tapError for logging and handling errors
 */
export function basicTapErrorExamples() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 1: Basic TapError Usage");

    // Error result with logging
    const errorResult = error(new Error("Something went wrong"));
    const tappedError = tapError(errorResult, err => {
        console.error(`Error occurred: ${err.message}`);
        console.error(`Stack trace: ${err.stack?.split('\n')[0] || 'none'}`);
    });

    console.log("Original error result:", errorResult);
    console.log("Tapped error result:", tappedError);
    console.log("Are they the same object?", errorResult === tappedError);

    // Success result - function won't be called
    const successResult = success(42);
    let successTapCalled = false;

    const tappedSuccess = tapError(successResult, err => {
        successTapCalled = true;
        console.log("This won't be called");
    });

    console.log("Original success result:", successResult);
    console.log("Tapped success result:", tappedSuccess);
    console.log("Was tap function called?", successTapCalled);

    // Custom error types
    class ValidationError extends Error {
        constructor(public field: string, message: string) {
            super(message);
            this.name = "ValidationError";
        }
    }

    const validationError = error(new ValidationError("email", "Invalid email format"));
    tapError(validationError, err => {
        const validationErr = err as ValidationError;
        console.error(`Validation failed for field '${validationErr.field}': ${validationErr.message}`);
    });

    return { errorResult, tappedError, successResult, tappedSuccess, successTapCalled, validationError };
}

/**
 * Example 2: Error Tracking and Monitoring
 * 
 * Shows how to use tapError for tracking and monitoring errors
 */
export function errorTrackingExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 2: Error Tracking and Monitoring");

    // Track error frequency by type
    const errorStats: Record<string, number> = {};

    // Error tracking function
    function trackError<T, E extends Error>(result: Result<T, E>): Result<T, E> {
        return tapError(result, err => {
            // Count by error name
            const errorType = err.name || "UnknownError";
            errorStats[errorType] = (errorStats[errorType] || 0) + 1;

            console.log(`Tracked error: ${errorType}, count: ${errorStats[errorType]}`);
        });
    }

    // Generate various errors
    const validationError = error(new Error("Invalid input"));
    validationError.error.name = "ValidationError";

    const networkError = error(new Error("Network failure"));
    networkError.error.name = "NetworkError";

    const databaseError = error(new Error("Database connection failed"));
    databaseError.error.name = "DatabaseError";

    // Track the errors
    trackError(validationError);
    trackError(networkError);
    trackError(validationError); // Second validation error
    trackError(databaseError);
    trackError(networkError); // Second network error
    trackError(networkError); // Third network error

    // Success result won't affect tracking
    trackError(success("This works fine"));

    console.log("Error statistics:", errorStats);
    console.log("Total tracked errors:", Object.values(errorStats).reduce((sum, count) => sum + count, 0));

    // Find most common error
    let mostCommonError = "";
    let highestCount = 0;

    for (const [errorType, count] of Object.entries(errorStats)) {
        if (count > highestCount) {
            mostCommonError = errorType;
            highestCount = count;
        }
    }

    console.log(`Most common error: ${mostCommonError} (${highestCount} occurrences)`);

    return {
        validationError,
        networkError,
        databaseError,
        errorStats,
        mostCommonError,
        highestCount
    };
}

/**
 * Example 3: Error Handling in Transformation Pipelines
 * 
 * Demonstrates how to use tapError within transformation chains
 */
export function errorHandlingPipelineExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 3: Error Handling in Transformation Pipelines");

    // Define domain-specific error types
    class ValidationError extends Error {
        constructor(public field: string, message: string) {
            super(message);
            this.name = "ValidationError";
        }
    }

    class NetworkError extends Error {
        constructor(public statusCode: number, message: string) {
            super(message);
            this.name = "NetworkError";
        }
    }

    class DatabaseError extends Error {
        constructor(public code: string, message: string) {
            super(message);
            this.name = "DatabaseError";
        }
    }

    // Define operation functions
    function validateInput(input: string): Result<string, ValidationError> {
        return input.length >= 3
            ? success(input)
            : error(new ValidationError("input", "Input must be at least 3 characters"));
    }

    function fetchData(input: string): Result<any, NetworkError> {
        return input === "error"
            ? error(new NetworkError(500, "Server error"))
            : success({ id: 1, data: `Data for ${input}` });
    }

    function saveToDatabase(data: any): Result<string, DatabaseError> {
        return data.id > 100
            ? error(new DatabaseError("DB_ERROR", "Invalid ID range"))
            : success(`Saved ${data.id}`);
    }

    // Create an error-aware processing pipeline
    function processPipeline(input: string) {
        console.log(`Starting pipeline with input: "${input}"`);

        // Step 1: Validate the input
        const validationResult = validateInput(input);

        // Log validation errors
        const validationWithLog = tapError(validationResult, err => {
            console.error(`Validation failed: ${err.message} (field: ${err.field})`);
        });

        // Step 2: Fetch data from API
        const fetchResult = chain(validationWithLog, fetchData);

        // Log network errors
        const fetchWithLog = tapError(fetchResult, err => {
            console.error(`Network error (${err.statusCode}): ${err.message}`);
        });

        // Step 3: Save to database
        const saveResult = chain(fetchWithLog, saveToDatabase);

        // Log database errors
        const finalResult = tapError(saveResult, err => {
            console.error(`Database error (${err.code}): ${err.message}`);
        });

        return finalResult;
    }

    // Test with various inputs
    console.log("\nTest 1: Valid input");
    const validResult = processPipeline("valid");
    console.log("Pipeline result:", validResult);

    console.log("\nTest 2: Validation failure");
    const invalidResult = processPipeline("ab");
    console.log("Pipeline result:", invalidResult);

    console.log("\nTest 3: Network error");
    const networkFailResult = processPipeline("error");
    console.log("Pipeline result:", networkFailResult);

    return { validResult, invalidResult, networkFailResult };
}

/**
 * Example 4: Practical Error Handling Applications
 * 
 * Demonstrates real-world scenarios where tapError is useful
 */
export function practicalErrorHandlingExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 4: Practical Error Handling Applications");

    // 1. Error Logging System
    console.log("Error Logging System Example:");

    const errorLog: Array<{
        timestamp: string;
        errorType: string;
        message: string;
        context?: any;
    }> = [];

    function logError<T, E extends Error>(
        context: string,
        result: Result<T, E>
    ): Result<T, E> {
        return tapError(result, err => {
            errorLog.push({
                timestamp: new Date().toISOString(),
                errorType: err.name || 'Error',
                message: err.message,
                context
            });
            console.log(`Logged error from ${context}: ${err.message}`);
        });
    }

    // Example usage
    const validationErr = error(new Error("Invalid email format"));
    validationErr.error.name = "ValidationError";

    const dbErr = error(new Error("Query execution failed"));
    dbErr.error.name = "DatabaseError";

    logError("user-registration", validationErr);
    logError("db-query", dbErr);
    logError("payment-processing", success("Payment successful")); // Won't log

    console.log("Error log:", errorLog);

    // 2. Retry System - Mark operations for retry
    console.log("\nRetry System Example:");

    const retryQueue: Array<{
        operation: string;
        timestamp: string;
        retryCount: number;
        error: Error;
    }> = [];

    function markForRetry<T>(
        operation: string,
        maxRetries: number,
        result: Result<T, Error>
    ): Result<T, Error> {
        return tapError(result, err => {
            // Check if already in retry queue
            const existingRetry = retryQueue.find(r => r.operation === operation);

            if (existingRetry) {
                if (existingRetry.retryCount < maxRetries) {
                    existingRetry.retryCount++;
                    existingRetry.timestamp = new Date().toISOString();
                    existingRetry.error = err;
                    console.log(`Incremented retry for ${operation}: attempt ${existingRetry.retryCount}/${maxRetries}`);
                } else {
                    console.log(`Max retries reached for ${operation}, giving up.`);
                }
            } else {
                retryQueue.push({
                    operation,
                    timestamp: new Date().toISOString(),
                    retryCount: 1,
                    error: err
                });
                console.log(`Added ${operation} to retry queue: attempt 1/${maxRetries}`);
            }
        });
    }

    // Example usage
    const failedOp1 = markForRetry(
        "send-email",
        3,
        error(new Error("SMTP connection failed"))
    );

    const failedOp2 = markForRetry(
        "process-payment",
        2,
        error(new Error("Gateway timeout"))
    );

    // Simulate retries
    markForRetry("send-email", 3, error(new Error("SMTP connection failed")));
    markForRetry("send-email", 3, error(new Error("SMTP authentication failed")));
    markForRetry("process-payment", 2, error(new Error("Invalid card")));

    console.log("Retry queue:", retryQueue);

    // 3. User-friendly error messages
    console.log("\nUser-friendly Error Messages Example:");

    const errorMessages: Record<string, string> = {
        "ValidationError": "Please check your input and try again.",
        "NetworkError": "Connection problem. Please check your internet connection.",
        "AuthenticationError": "Login failed. Please check your credentials.",
        "DatabaseError": "We're experiencing technical difficulties. Please try again later.",
        "default": "An unexpected error occurred. Please try again later."
    };

    function getUserMessage<T, E extends Error>(result: Result<T, E>): string {
        let message = "";

        tapError(result, err => {
            const errorType = err.name || "Error";
            message = errorMessages[errorType] || errorMessages.default;
        });

        return message || "No error";
    }

    // Example usage
    const validationError = error(new Error("Invalid input"));
    validationError.error.name = "ValidationError";

    const networkError = error(new Error("Connection timeout"));
    networkError.error.name = "NetworkError";

    const unknownError = error(new Error("Something unexpected"));

    console.log("ValidationError:", getUserMessage(validationError));
    console.log("NetworkError:", getUserMessage(networkError));
    console.log("Unknown error:", getUserMessage(unknownError));
    console.log("Success result:", getUserMessage(success("Works fine")));

    return {
        loggingExample: {
            errorLog,
            validationErr,
            dbErr
        },
        retryExample: {
            retryQueue,
            failedOp1,
            failedOp2
        },
        userMessageExample: {
            validationError,
            networkError,
            unknownError,
            validationMessage: getUserMessage(validationError),
            networkMessage: getUserMessage(networkError),
            unknownMessage: getUserMessage(unknownError)
        }
    };
}

// Run all examples
function runTapErrorExamples() {
    basicTapErrorExamples();
    errorTrackingExample();
    errorHandlingPipelineExample();
    practicalErrorHandlingExample();
}

// Uncomment to run
runTapErrorExamples();