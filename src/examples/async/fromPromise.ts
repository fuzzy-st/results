/**
 * Examples demonstrating the usage of the fromPromise method
 * from the Result pattern library.
 */

import { fromPromise } from "~/lib/async/fromPromise";
import { match } from "~/lib/core/match";
import { isSuccess } from "~/lib/core/isSuccess";
import { isError } from "~/lib/core/isError";
import type { Result } from "~/types";

/**
 * Example 1: Basic Promise Handling
 * 
 * Demonstrates how to convert Promises to Results for clean error handling
 */
export async function basicPromiseExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 1: Basic Promise Handling");

    // Create a successful Promise
    const successPromise = Promise.resolve({ id: 1, name: "John" });

    // Convert to a Result
    const successResult = await fromPromise(successPromise);
    console.log("Success Result:", successResult);

    // Handle using match
    const successMessage = match(successResult, {
        success: data => `User found: ${data.name} (ID: ${data.id})`,
        error: err => `Error: ${err.message}`
    });
    console.log("Success Message:", successMessage);

    // Create a failing Promise
    const failingPromise = Promise.reject(new Error("User not found"));

    // Convert to a Result
    const errorResult = await fromPromise(failingPromise);
    console.log("Error Result:", errorResult);

    // Handle using match
    const errorMessage = match(errorResult, {
        success: data => `User found: ${JSON.stringify(data)}`,
        error: err => `Error occurred: ${err.message}`
    });
    console.log("Error Message:", errorMessage);

    return { successResult, errorResult };
}

/**
 * Example 2: API Request with Error Handling
 * 
 * Shows how to use fromPromise with a simulated API request
 */
export async function apiRequestExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 2: API Request with Error Handling");

    // Simulate a fetch request
    function fetchUser(id: number): Promise<any> {
        // Simulate network delay
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (id > 0 && id < 100) {
                    resolve({ id, name: `User ${id}`, email: `user${id}@example.com` });
                } else {
                    reject(new Error(`User with ID ${id} not found`));
                }
            }, 500);
        });
    }

    // Custom error type
    class ApiError extends Error {
        constructor(public statusCode: number, message: string) {
            super(message);
            this.name = "ApiError";
        }
    }

    // Error transformer
    function apiErrorTransformer(err: unknown): ApiError {
        const message = err instanceof Error ? err.message : String(err);
        return new ApiError(404, `API error: ${message}`);
    }

    console.log("Fetching valid user (ID: 42)...");
    const validUserResult = await fromPromise(
        fetchUser(42),
        apiErrorTransformer
    );

    console.log("Valid User Result:", validUserResult);

    console.log("\nFetching invalid user (ID: 999)...");
    const invalidUserResult = await fromPromise(
        fetchUser(999),
        apiErrorTransformer
    );

    console.log("Invalid User Result:", invalidUserResult);

    if (isError(invalidUserResult)) {
        const apiError = invalidUserResult.error as ApiError;
        console.log(`Status code: ${apiError.statusCode}`);
    }

    return { validUserResult, invalidUserResult };
}

/**
 * Example 3: Async Data Processing Pipeline
 * 
 * Demonstrates using fromPromise in a data processing pipeline
 */
export async function processingPipelineExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 3: Async Data Processing Pipeline");

    // Simulated data processing functions
    async function fetchData(): Promise<string[]> {
        // Simulate API call that returns data
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(["apple", "banana", "cherry", "date"]);
            }, 300);
        });
    }

    async function processData(data: string[]): Promise<{ item: string, length: number }[]> {
        // Process the data (could throw an error)
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    if (!Array.isArray(data)) {
                        reject(new Error("Expected array data"));
                    }

                    const processed = data.map(item => ({
                        item,
                        length: item.length
                    }));

                    resolve(processed);
                } catch (err) {
                    reject(err);
                }
            }, 300);
        });
    }

    async function saveResults(processed: any[]): Promise<{ success: boolean, count: number }> {
        // Simulate saving results to a database
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (processed.length > 0) {
                    resolve({ success: true, count: processed.length });
                } else {
                    reject(new Error("No items to save"));
                }
            }, 300);
        });
    }

    // Build a pipeline of operations
    console.log("Starting data processing pipeline...");

    console.log("Step 1: Fetching data...");
    const fetchResult = await fromPromise(fetchData());

    if (isError(fetchResult)) {
        console.error("Pipeline failed at fetch step:", fetchResult.error.message);
        return { success: false, error: fetchResult.error };
    }

    console.log("Fetched data:", fetchResult.data);

    console.log("Step 2: Processing data...");
    const processResult = await fromPromise(processData(fetchResult.data));

    if (isError(processResult)) {
        console.error("Pipeline failed at process step:", processResult.error.message);
        return { success: false, error: processResult.error };
    }

    console.log("Processed data:", processResult.data);

    console.log("Step 3: Saving results...");
    const saveResult = await fromPromise(saveResults(processResult.data));

    if (isError(saveResult)) {
        console.error("Pipeline failed at save step:", saveResult.error.message);
        return { success: false, error: saveResult.error };
    }

    console.log("Save result:", saveResult.data);
    console.log("Pipeline completed successfully!");

    return {
        success: true,
        fetchResult: fetchResult.data,
        processResult: processResult.data,
        saveResult: saveResult.data
    };
}

/**
 * Example 4: Handling Non-Standard Promise Rejections
 * 
 * Shows how fromPromise handles various types of Promise rejections
 */
export async function nonStandardRejectionsExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 4: Handling Non-Standard Promise Rejections");

    // String rejection
    const stringRejection = Promise.reject("Not authorized");
    console.log("Converting string rejection...");
    const stringResult = await fromPromise(stringRejection);
    console.log("String Rejection Result:", stringResult);

    // Number rejection
    const numberRejection = Promise.reject(404);
    console.log("\nConverting number rejection...");
    const numberResult = await fromPromise(numberRejection);
    console.log("Number Rejection Result:", numberResult);

    // Object rejection
    const objectRejection = Promise.reject({ code: 500, message: "Server error" });
    console.log("\nConverting object rejection...");
    const objectResult = await fromPromise(objectRejection);
    console.log("Object Rejection Result:", objectResult);

    // Custom error transformer for object rejections
    const objectWithTransformer = await fromPromise(
        Promise.reject({ code: 403, message: "Forbidden" }),
        (err) => {
            if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
                const e = err as { code: number, message: string };
                return new Error(`HTTP ${e.code}: ${e.message}`);
            }
            return new Error(String(err));
        }
    );
    console.log("\nObject rejection with custom transformer:", objectWithTransformer);

    return {
        stringResult,
        numberResult,
        objectResult,
        objectWithTransformer
    };
}

// Run all examples
async function runFromPromisesExamples() {
    await basicPromiseExample();
    await apiRequestExample();
    await processingPipelineExample();
    await nonStandardRejectionsExample();
}

// Uncomment to run the examples
// await runFromPromisesExamples();