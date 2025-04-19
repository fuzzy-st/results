/**
 * Examples demonstrating the usage of the asyncMapError method
 * from the Result pattern library.
 */

import { asyncMapError } from "~/lib/async/asyncMapError";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";
import { isSuccess } from "~/lib/core/isSuccess";
import { isError } from "~/lib/core/isError";

/**
 * Example 1: Basic Async Error Transformation
 * 
 * Demonstrates how to transform an error value using an async function
 */
export async function basicAsyncMapErrorExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 1: Basic Async Error Transformation");

    // Create an error result
    const errorResult = error(new Error("Database connection failed"));

    // Define an async transformation function that enriches the error
    const asyncEnrichError = async (err: Error): Promise<Error> => {
        // Simulate async operation (e.g., logging to external service)
        await new Promise(resolve => setTimeout(resolve, 100));

        const enrichedError = new Error(`Enhanced error: ${err.message}`);
        // Add stack trace from original error
        enrichedError.stack = err.stack;

        return enrichedError;
    };

    // Apply the async transformation
    console.log("Original error result:", errorResult);
    console.log("Applying asyncEnrichError...");

    const enrichedResult = await asyncMapError(errorResult, asyncEnrichError);
    console.log("Transformed error result:", enrichedResult);

    // Test with success result to demonstrate short-circuiting
    const successResult = success(42);
    console.log("\nTesting with success result:");
    console.log("Success result:", successResult);

    const unchangedSuccess = await asyncMapError(successResult, asyncEnrichError);
    console.log("Transformed success result:", unchangedSuccess);
    console.log("Notice the success is preserved, and asyncEnrichError was not called.");

    return { errorResult, enrichedResult, successResult, unchangedSuccess };
}

/**
 * Example 2: Error Classification and Translation
 * 
 * Shows how to use asyncMapError to classify errors and translate them to user-friendly messages
 */
export async function errorClassificationExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 2: Error Classification and Translation");

    // Define custom error types
    class DatabaseError extends Error {
        constructor(message: string, public code: string) {
            super(message);
            this.name = "DatabaseError";
        }
    }

    class NetworkError extends Error {
        constructor(message: string, public statusCode: number) {
            super(message);
            this.name = "NetworkError";
        }
    }

    class ValidationError extends Error {
        constructor(message: string, public field: string) {
            super(message);
            this.name = "ValidationError";
        }
    }

    class UserFacingError extends Error {
        constructor(
            public userMessage: string,
            public errorCode: string,
            public severity: "low" | "medium" | "high",
            public originalError?: Error
        ) {
            super(userMessage);
            this.name = "UserFacingError";
        }
    }

    // Simulated error message database
    const errorMessages: Record<string, { message: string, severity: "low" | "medium" | "high" }> = {
        "DB_CONNECTION": {
            message: "We're having trouble connecting to our database. Please try again later.",
            severity: "high"
        },
        "DB_QUERY": {
            message: "We encountered an issue while processing your request. Our team has been notified.",
            severity: "medium"
        },
        "NETWORK_4XX": {
            message: "The requested resource could not be found or accessed.",
            severity: "low"
        },
        "NETWORK_5XX": {
            message: "Our servers are currently experiencing issues. Please try again later.",
            severity: "high"
        },
        "VALIDATION": {
            message: "Please check your input and try again.",
            severity: "low"
        },
        "UNKNOWN": {
            message: "An unexpected error occurred. Please try again later.",
            severity: "medium"
        }
    };

    // Async function to translate errors
    async function translateError(err: Error): Promise<UserFacingError> {
        // Simulate API call to translation service or database lookup
        await new Promise(resolve => setTimeout(resolve, 150));

        let errorCode = "UNKNOWN";
        let userMessage = errorMessages.UNKNOWN.message;
        let severity = errorMessages.UNKNOWN.severity;

        // Classify error based on type
        if (err instanceof DatabaseError) {
            errorCode = `DB_${err.code}`;
            // Default fallback for database errors
            userMessage = errorMessages.DB_CONNECTION.message;
            severity = errorMessages.DB_CONNECTION.severity;

            // More specific message if available
            if (errorCode === "DB_QUERY" && errorMessages[errorCode]) {
                userMessage = errorMessages[errorCode].message;
                severity = errorMessages[errorCode].severity;
            }
        }
        else if (err instanceof NetworkError) {
            errorCode = err.statusCode >= 500 ? "NETWORK_5XX" : "NETWORK_4XX";
            userMessage = errorMessages[errorCode].message;
            severity = errorMessages[errorCode].severity;
        }
        else if (err instanceof ValidationError) {
            errorCode = "VALIDATION";
            // Create more specific message for validation errors
            userMessage = `${errorMessages.VALIDATION.message} Field: ${err.field}`;
            severity = errorMessages.VALIDATION.severity;
        }

        return new UserFacingError(
            userMessage,
            errorCode,
            severity,
            err
        );
    }

    // Create various error types
    const dbError = error(new DatabaseError("Failed to connect to database", "CONNECTION"));
    const networkError = error(new NetworkError("Server returned status code 500", 500));
    const validationError = error(new ValidationError("Invalid email format", "email"));

    // Translate errors
    console.log("Translating database error...");
    const translatedDbError = await asyncMapError(dbError, translateError);

    console.log("Translating network error...");
    const translatedNetworkError = await asyncMapError(networkError, translateError);

    console.log("Translating validation error...");
    const translatedValidationError = await asyncMapError(validationError, translateError);

    // Display results
    console.log("\nOriginal Database Error:", dbError);
    console.log("Translated Database Error:", translatedDbError);
    console.log("User message:", isError(translatedDbError) && translatedDbError.error.userMessage);

    console.log("\nOriginal Network Error:", networkError);
    console.log("Translated Network Error:", translatedNetworkError);
    console.log("User message:", isError(translatedNetworkError) && translatedNetworkError.error.userMessage);

    console.log("\nOriginal Validation Error:", validationError);
    console.log("Translated Validation Error:", translatedValidationError);
    console.log("User message:", isError(translatedValidationError) && translatedValidationError.error.userMessage);

    return {
        translatedDbError,
        translatedNetworkError,
        translatedValidationError
    };
}

/**
 * Example 3: Error Recovery Attempts
 * 
 * Shows how to use asyncMapError to attempt recovery from errors
 */
export async function errorRecoveryExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 3: Error Recovery Attempts");

    // Simulated cache
    const cache = new Map<string, any>();

    // Simulation of a failed API request
    const apiErrorResult = error(new Error("API request failed"));

    // Attempt to recover from API error by checking the cache
    async function recoverFromCache(err: Error): Promise<Error> {
        console.log(`Attempting to recover from error: ${err.message}`);

        // Simulate checking cache
        await new Promise(resolve => setTimeout(resolve, 100));

        const cacheKey = "user-data";
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            console.log("Found data in cache! Converting to success result...");
            // This is a special case - we want to convert to a success result
            // We have to throw a special object to change the result type
            throw { __recoveredData: cachedData };
        }

        // If no recovery possible, enrich original error with recovery attempt info
        const enhancedError = new Error(`${err.message} (Recovery attempted: cache miss)`);
        return enhancedError;
    }

    // Custom wrapper around asyncMapError that handles special recovery case
    async function attemptRecovery<T, E>(
        result: Result<T, E>,
        recoveryFn: (error: E) => Promise<E>
    ): Promise<Result<T | any, E>> {
        try {
            // Try regular error mapping
            const mappedResult = await asyncMapError(result, recoveryFn);
            return mappedResult;
        } catch (recoveryResult) {
            // Check if this is our special recovery signal
            if (
                typeof recoveryResult === 'object' &&
                recoveryResult !== null &&
                '__recoveredData' in recoveryResult
            ) {
                // Convert to success result with recovered data
                return success(recoveryResult.__recoveredData);
            }

            // Regular exception - pass it along
            throw recoveryResult;
        }
    }

    // First attempt - cache is empty, recovery should fail
    console.log("First recovery attempt (cache empty):");
    const firstAttempt = await attemptRecovery(apiErrorResult, recoverFromCache);
    console.log("First attempt result:", firstAttempt);

    // Populate cache for next attempt
    console.log("\nPopulating cache...");
    cache.set("user-data", { id: 1, name: "Cached User", timestamp: new Date().toISOString() });

    // Second attempt - cache has data, recovery should succeed
    console.log("\nSecond recovery attempt (cache populated):");
    const secondAttempt = await attemptRecovery(apiErrorResult, recoverFromCache);
    console.log("Second attempt result:", secondAttempt);

    if (isSuccess(secondAttempt)) {
        console.log("Recovery successful! Retrieved data:", secondAttempt.data);
    }

    return {
        firstAttempt,
        secondAttempt
    };
}

/**
 * Example 4: Error Enrichment in an API Context
 * 
 * Shows how to use asyncMapError to enrich errors with additional information
 */
export async function errorEnrichmentExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 4: Error Enrichment in an API Context");

    // Define error class with request context
    class ApiError extends Error {
        constructor(
            message: string,
            public statusCode: number,
            public requestId?: string,
            public endpoint?: string,
            public timestamp?: string
        ) {
            super(message);
            this.name = "ApiError";
        }
    }

    // Simplified request metadata service
    async function fetchRequestMetadata(error: Error): Promise<ApiError> {
        // Simulate fetching additional context about the request that failed
        await new Promise(resolve => setTimeout(resolve, 120));

        // In a real application, this might look up request details from
        // a log store, metrics system, or other monitoring infrastructure

        // Extract status code if it's in the message (simplified example)
        let statusCode = 500; // Default to server error
        if (error.message.includes("404")) statusCode = 404;
        if (error.message.includes("401")) statusCode = 401;
        if (error.message.includes("403")) statusCode = 403;

        return new ApiError(
            error.message,
            statusCode,
            `req-${Date.now().toString(36)}`, // Generate a request ID
            error.message.includes("users") ? "/api/users" : "/api/unknown",
            new Date().toISOString()
        );
    }

    // Create some error results simulating API failures
    const notFoundError = error(new Error("Resource not found (404) for users/123"));
    const serverError = error(new Error("Internal server error occurred"));
    const authError = error(new Error("Authentication failed (401)"));

    // Enrich errors with metadata
    console.log("Enriching 'not found' error...");
    const enrichedNotFound = await asyncMapError(notFoundError, fetchRequestMetadata);

    console.log("Enriching server error...");
    const enrichedServerError = await asyncMapError(serverError, fetchRequestMetadata);

    console.log("Enriching auth error...");
    const enrichedAuthError = await asyncMapError(authError, fetchRequestMetadata);

    // Display the enriched errors
    if (isError(enrichedNotFound)) {
        const apiError = enrichedNotFound.error as ApiError;
        console.log("\nEnriched 'not found' error:");
        console.log(`Message: ${apiError.message}`);
        console.log(`Status code: ${apiError.statusCode}`);
        console.log(`Request ID: ${apiError.requestId}`);
        console.log(`Endpoint: ${apiError.endpoint}`);
        console.log(`Timestamp: ${apiError.timestamp}`);
    }

    if (isError(enrichedServerError)) {
        const apiError = enrichedServerError.error as ApiError;
        console.log("\nEnriched server error:");
        console.log(`Message: ${apiError.message}`);
        console.log(`Status code: ${apiError.statusCode}`);
        console.log(`Request ID: ${apiError.requestId}`);
        console.log(`Endpoint: ${apiError.endpoint}`);
        console.log(`Timestamp: ${apiError.timestamp}`);
    }

    if (isError(enrichedAuthError)) {
        const apiError = enrichedAuthError.error as ApiError;
        console.log("\nEnriched auth error:");
        console.log(`Message: ${apiError.message}`);
        console.log(`Status code: ${apiError.statusCode}`);
        console.log(`Request ID: ${apiError.requestId}`);
        console.log(`Endpoint: ${apiError.endpoint}`);
        console.log(`Timestamp: ${apiError.timestamp}`);
    }

    // Show how this would work in an actual error handling system
    console.log("\nSimulating API error handling flow:");

    function handleApiError(apiError: ApiError) {
        console.log(`[ERROR][${apiError.statusCode}][${apiError.requestId}] ${apiError.message}`);

        // Different handling based on status code
        switch (Math.floor(apiError.statusCode / 100)) {
            case 4:
                console.log("Client error - Display message to user");
                break;
            case 5:
                console.log("Server error - Report to monitoring system");
                // In a real app, might send to error monitoring service
                console.log(`Would send to error monitoring: ${JSON.stringify({
                    type: "api_error",
                    status: apiError.statusCode,
                    requestId: apiError.requestId,
                    endpoint: apiError.endpoint,
                    message: apiError.message,
                    timestamp: apiError.timestamp
                })}`);
                break;
        }
    }

    // Example usage in error handling flow
    if (isError(enrichedNotFound)) {
        handleApiError(enrichedNotFound.error as ApiError);
    }

    if (isError(enrichedServerError)) {
        handleApiError(enrichedServerError.error as ApiError);
    }

    return {
        enrichedNotFound,
        enrichedServerError,
        enrichedAuthError
    };
}

// Run all examples
async function runAsyncMapErrorExamples() {
    await basicAsyncMapErrorExample();
    await errorClassificationExample();
    await errorRecoveryExample();
    await errorEnrichmentExample();
}

// Uncomment to run the examples
// await runAsyncMapErrorExamples();