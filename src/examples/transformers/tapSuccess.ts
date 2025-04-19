/**
 * Examples demonstrating the usage of the tapSuccess method
 * from the Result pattern library.
 */

import { tapSuccess } from "~/lib/transformers/tapSuccess";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";
import { chain } from "~/lib/transformers/chain";
import type { Result } from "~/types";

/**
 * Example 1: Basic TapSuccess Usage
 * 
 * Demonstrates the basic usage of tapSuccess for logging and debugging successful results
 */
export function basicTapSuccessExamples() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 1: Basic TapSuccess Usage");

    // Success result with logging
    const successResult = success(42);
    const tappedSuccess = tapSuccess(successResult, data => {
        console.log(`Processing successful result with value: ${data}`);
    });

    console.log("Original success result:", successResult);
    console.log("Tapped success result:", tappedSuccess);
    console.log("Are they the same object?", successResult === tappedSuccess);

    // Error result - function won't be called
    const errorResult = error(new Error("Something went wrong"));
    let errorTapCalled = false;

    const tappedError = tapSuccess(errorResult, data => {
        errorTapCalled = true;
        console.log("This won't be called");
    });

    console.log("Original error result:", errorResult);
    console.log("Tapped error result:", tappedError);
    console.log("Was tap function called?", errorTapCalled);

    return { successResult, tappedSuccess, errorResult, tappedError, errorTapCalled };
}

/**
 * Example 2: Data Collection and Analysis
 * 
 * Shows how to use tapSuccess for collecting and analyzing successful data
 */
export function dataCollectionExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 2: Data Collection and Analysis");

    // Create a series of results
    const results = [
        success(10),
        error(new Error("Failed operation")),
        success(20),
        success(30),
        error(new Error("Another failure")),
        success(40)
    ];

    // Collect statistics
    let sum = 0;
    let count = 0;
    const values: number[] = [];

    // Process each result
    const processedResults = results.map(result =>
        tapSuccess(result, value => {
            sum += value;
            count++;
            values.push(value);
        })
    );

    // Calculate statistics
    const average = count > 0 ? sum / count : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;

    console.log("Processed all results.");
    console.log("Statistics:");
    console.log("- Total successful results:", count);
    console.log("- Sum of values:", sum);
    console.log("- Average value:", average);
    console.log("- Max value:", max);
    console.log("- Min value:", min);

    // Verify the results are unchanged
    console.log("Original results are unchanged:",
        results.every((r, i) => r === processedResults[i]));

    return {
        results,
        processedResults,
        statistics: { count, sum, average, max, min, values }
    };
}

/**
 * Example 3: Integrating TapSuccess in Transformation Pipelines
 * 
 * Demonstrates how to use tapSuccess within transformation chains
 */
export function transformationPipelineExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 3: Integrating TapSuccess in Transformation Pipelines");

    // Simulated processing pipeline with logging

    // 1. Parse a string value to a number
    function parseStringValue(input: string): Result<number, Error> {
        const parsed = Number(input);
        return isNaN(parsed)
            ? error(new Error(`Invalid number format: "${input}"`))
            : success(parsed);
    }

    // 2. Validate the number is in range
    function validateRange(input: number): Result<number, Error> {
        return (input >= 1 && input <= 100)
            ? success(input)
            : error(new Error(`Value ${input} out of range (1-100)`));
    }

    // 3. Process valid numbers
    function processNumber(input: number): Result<string, Error> {
        return success(`Processed: ${input}`);
    }

    // Create a processing pipeline with logging at each step
    function processPipeline(input: string) {
        console.log(`Starting pipeline with input: "${input}"`);

        // Step 1: Parse the string
        const parseResult = parseStringValue(input);

        // Log successful parsing
        const parsedWithLog = tapSuccess(parseResult, value => {
            console.log(`Successfully parsed "${input}" to number ${value}`);
        });

        // Step 2: Validate range
        const validationResult = chain(parsedWithLog, validateRange);

        // Log successful validation
        const validatedWithLog = tapSuccess(validationResult, value => {
            console.log(`Validated ${value} is in range 1-100`);
        });

        // Step 3: Process the number
        const processingResult = chain(validatedWithLog, processNumber);

        // Log final processing
        const finalResult = tapSuccess(processingResult, value => {
            console.log(`Final result: ${value}`);
        });

        return finalResult;
    }

    // Test the pipeline with various inputs
    console.log("\nExample 1: Valid input");
    const validResult = processPipeline("42");
    console.log("Pipeline result:", validResult);

    console.log("\nExample 2: Invalid format");
    const invalidFormatResult = processPipeline("not-a-number");
    console.log("Pipeline result:", invalidFormatResult);

    console.log("\nExample 3: Out of range");
    const outOfRangeResult = processPipeline("999");
    console.log("Pipeline result:", outOfRangeResult);

    return { validResult, invalidFormatResult, outOfRangeResult };
}

/**
 * Example 4: Practical Applications of TapSuccess
 * 
 * Demonstrates real-world scenarios where tapSuccess is useful
 */
export function practicalApplicationsExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 4: Practical Applications of TapSuccess");

    // 1. Cache Management - Store successful results in cache

    console.log("Cache Management Example:");
    const cache = new Map<string, any>();

    function fetchWithCache<T>(key: string, fetcher: () => Result<T, Error>): Result<T, Error> {
        // Check if in cache first
        if (cache.has(key)) {
            console.log(`Cache hit for ${key}`);
            return success(cache.get(key));
        }

        // Not in cache, execute fetcher
        console.log(`Cache miss for ${key}, fetching data...`);
        const result = fetcher();

        // Store only successful results in cache
        return tapSuccess(result, data => {
            console.log(`Storing ${key} in cache`);
            cache.set(key, data);
        });
    }

    // Example usage
    const firstFetch = fetchWithCache("item-1", () => success({ id: 1, name: "Item 1" }));
    console.log("First fetch result:", firstFetch);

    const secondFetch = fetchWithCache("item-1", () => success({ id: 1, name: "Updated Item" }));
    console.log("Second fetch result (from cache):", secondFetch);

    const failedFetch = fetchWithCache("item-error", () => error(new Error("Fetch failed")));
    console.log("Failed fetch result:", failedFetch);

    console.log("Cache contents:", Object.fromEntries(cache.entries()));

    // 2. Notification System - Trigger notifications on successful operations

    console.log("\nNotification System Example:");
    const notifications: string[] = [];

    function notifySuccess<T>(result: Result<T, Error>, message: string): Result<T, Error> {
        return tapSuccess(result, () => {
            notifications.push(`SUCCESS: ${message} at ${new Date().toISOString()}`);
            console.log(`Notification added: ${message}`);
        });
    }

    // Process some operations with notifications
    const operation1 = notifySuccess(success("User created"), "User creation successful");
    const operation2 = notifySuccess(error(new Error("Database error")), "This won't be added");
    const operation3 = notifySuccess(success("Payment processed"), "Payment completed");

    console.log("Operations results:", [operation1, operation2, operation3]);
    console.log("Notifications:", notifications);

    // 3. Audit Trail - Record successful operations for auditing

    console.log("\nAudit Trail Example:");
    const auditLog: Array<{ action: string, timestamp: string, data: any }> = [];

    function audit<T>(action: string, result: Result<T, Error>): Result<T, Error> {
        return tapSuccess(result, data => {
            auditLog.push({
                action,
                timestamp: new Date().toISOString(),
                data
            });
            console.log(`Audit trail: ${action}`);
        });
    }

    // Simulate a series of operations
    const userCreated = audit("CREATE_USER", success({ id: 123, name: "Alice" }));
    const loginFailed = audit("USER_LOGIN", error(new Error("Invalid credentials")));
    const paymentMade = audit("PROCESS_PAYMENT", success({ amount: 99.99, status: "completed" }));
    const logoutSuccess = audit("USER_LOGOUT", success({ userId: 123 }));

    console.log("Audit log:", auditLog);

    // 4. Metrics Collection - Gather performance metrics

    console.log("\nMetrics Collection Example:");
    const metrics = {
        totalProcessed: 0,
        totalSuccess: 0,
        totalErrors: 0,
        processingTimes: [] as number[]
    };

    function trackMetrics<T>(operation: string, startTime: number, result: Result<T, Error>): Result<T, Error> {
        // Always track total processed
        metrics.totalProcessed++;

        // Track only successful operations
        return tapSuccess(result, () => {
            const duration = Date.now() - startTime;
            metrics.totalSuccess++;
            metrics.processingTimes.push(duration);
            console.log(`Metrics: ${operation} completed in ${duration}ms`);
        });
    }

    // Track some operations
    const startTime1 = Date.now();
    const successOp = trackMetrics("OPERATION_1", startTime1, success("Success"));

    const startTime2 = Date.now();
    const errorOp = trackMetrics("OPERATION_2", startTime2, error(new Error("Failed")));

    // Error operations will still increment totalProcessed but not totalSuccess
    metrics.totalErrors = metrics.totalProcessed - metrics.totalSuccess;

    console.log("Metrics collected:", metrics);

    return {
        cacheExample: {
            firstFetch,
            secondFetch,
            failedFetch,
            cacheContents: Object.fromEntries(cache.entries())
        },
        notificationExample: {
            operation1,
            operation2,
            operation3,
            notifications
        },
        auditExample: {
            userCreated,
            loginFailed,
            paymentMade,
            logoutSuccess,
            auditLog
        },
        metricsExample: {
            successOp,
            errorOp,
            metrics
        }
    };
}

// Run all examples
function runTapSuccessExamples() {
    basicTapSuccessExamples();
    dataCollectionExample();
    transformationPipelineExample();
    practicalApplicationsExample();
}

// Uncomment to run
runTapSuccessExamples();