/**
 * Examples demonstrating the usage of the tap method
 * from the Result pattern library.
 */

import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import { chain } from "~/lib/transformers/chain";
import { map } from "~/lib/transformers/map";
import { tap } from "~/lib/transformers/tap";
import type { Result } from "~/types";

/**
 * Example 1: Basic Tap Usage
 *
 * Demonstrates the basic usage of tap for logging and debugging
 */
export function basicTapExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 1: Basic Tap Usage");

  // Success result with logging
  const successResult = success(42);
  const tappedSuccess = tap(successResult, (result) => {
    console.log(`Result status: ${result.status}`);
    if (result.status === "success") {
      console.log(`Data value: ${result.data}`);
    }
  });

  console.log("Original success result:", successResult);
  console.log("Tapped success result:", tappedSuccess);
  console.log("Are they the same object?", successResult === tappedSuccess);

  // Error result with logging
  const errorResult = error(new Error("Something went wrong"));
  const tappedError = tap(errorResult, (result) => {
    console.log(`Result status: ${result.status}`);
    if (result.status === "error") {
      console.log(`Error message: ${result.error.message}`);
    }
  });

  console.log("Original error result:", errorResult);
  console.log("Tapped error result:", tappedError);
  console.log("Are they the same object?", errorResult === tappedError);

  return { successResult, tappedSuccess, errorResult, tappedError };
}

/**
 * Example 2: Using Tap with Data Processing
 *
 * Shows how to use tap for additional processing and side effects
 */
export function dataProcessingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 2: Using Tap with Data Processing");

  // Count occurrences of numbers in an array
  const numbersResult = success([1, 2, 3, 2, 4, 1, 5, 1]);

  // We'll use this object to store counts
  const counts: Record<number, number> = {};

  // Process the data with tap without modifying the result
  const processedResult = tap(numbersResult, (result) => {
    if (result.status === "success") {
      // Count occurrences
      result.data.forEach((num) => {
        counts[num] = (counts[num] || 0) + 1;
      });
      console.log("Frequency count:", counts);
    }
  });

  console.log("Original numbers result:", numbersResult);
  console.log("Processed result:", processedResult);
  console.log("Counts object after processing:", counts);

  // Using tap in error scenarios
  const errorResult = error(new Error("Data retrieval failed"));

  // Track error occurrences
  let errorCount = 0;

  const monitoredError = tap(errorResult, (result) => {
    if (result.status === "error") {
      errorCount++;
      console.log(`Error occurred. Total errors: ${errorCount}`);
    }
  });

  console.log("Original error result:", errorResult);
  console.log("Monitored error result:", monitoredError);
  console.log("Error count after monitoring:", errorCount);

  return {
    numbersResult,
    processedResult,
    counts,
    errorResult,
    monitoredError,
    errorCount,
  };
}

/**
 * Example 3: Combining Tap with Other Transformers
 *
 * Demonstrates how to integrate tap into transformation pipelines
 */
export function combinedTransformerExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 3: Combining Tap with Other Transformers");

  // Start with a success result
  const initialResult = success(5);
  console.log("Initial result:", initialResult);

  // Create a sequence of transformations with logging
  const step1 = map(initialResult, (x) => x * 2);
  const step1WithLog = tap(step1, (result) => {
    console.log("After map (x * 2):", result);
  });

  const step2 = map(step1WithLog, (x) => x + 1);
  const step2WithLog = tap(step2, (result) => {
    console.log("After map (x + 1):", result);
  });

  // Define a validation function for the chain step
  function validateEven(n: number): Result<number, Error> {
    return n % 2 === 0 ? success(n) : error(new Error("Number must be even"));
  }

  const step3 = chain(step2WithLog, validateEven);
  const finalResult = tap(step3, (result) => {
    console.log("After chain (validateEven):", result);
  });

  console.log("Final result:", finalResult);

  // Another example with early error
  const errorExample = tap(
    map(
      tap(error(new Error("Initial error")), (r) => console.log("Initial error result:", r)),
      (x) => x * 2, // This won't execute due to short-circuiting
    ),
    (r) => console.log("After map (should still be error):", r),
  );

  console.log("Error example final result:", errorExample);

  return {
    initialResult,
    step1,
    step1WithLog,
    step2,
    step2WithLog,
    step3,
    finalResult,
    errorExample,
  };
}

/**
 * Example 4: Practical Tap Applications
 *
 * Demonstrates real-world use cases for tap
 */
// Simulated metrics collector
interface Metrics {
  successCount: number;
  errorCount: number;
  totalOperations: number;
  startTimes: Record<string, number>;
  durations: Record<string, number>;
}

export function practicalTapExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 4: Practical Tap Applications");

  // 1. Logging/Metrics - Track performance and outcomes
  const metrics: Metrics = {
    successCount: 0,
    errorCount: 0,
    totalOperations: 0,
    startTimes: {},
    durations: {},
  };

  // Helper functions for metrics
  function startOperation(name: string) {
    metrics.startTimes[name] = Date.now();
    metrics.totalOperations++;
  }

  function endOperation(name: string, success: boolean) {
    const duration = Date.now() - (metrics.startTimes[name] || Date.now());
    metrics.durations[name] = duration;

    if (success) {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }
  }

  // Use tap to track a complex operation
  function doSomethingComplex(input: number): Result<number, Error> {
    const operationName = "complex_operation";
    startOperation(operationName);

    let result: Result<number, Error>;

    try {
      if (input < 0) {
        result = error(new Error("Input must be positive"));
      } else {
        // Imagine some complex processing here
        const output = input * 2 + 1;
        result = success(output);
      }
    } catch (err) {
      result = error(err instanceof Error ? err : new Error(String(err)));
    }

    // Use tap to record metrics without modifying the result
    return tap(result, (r) => {
      endOperation(operationName, r.status === "success");
      console.log(`Operation ${operationName} ${r.status === "success" ? "succeeded" : "failed"}`);
    });
  }

  const successOperation = doSomethingComplex(5);
  const failedOperation = doSomethingComplex(-1);

  console.log("Success operation result:", successOperation);
  console.log("Failed operation result:", failedOperation);
  console.log("Metrics after operations:", metrics);

  // 2. Debugging/Tracing - Add trace information to results

  function processUserData(userId: number): Result<string, Error> {
    const traceLog: string[] = [];

    // Step 1: Validate user ID
    const validationResult = tap(
      userId > 0 ? success(userId) : error(new Error("Invalid user ID")),
      (r) => traceLog.push(`Step 1 (Validation): ${r.status}`),
    );

    if (validationResult.status === "error") {
      return tap(validationResult, (_r) => {
        console.log("Trace log:", traceLog);
      });
    }

    // Step 2: Fetch user (simulated)
    const userData = tap(
      userId === 42
        ? error(new Error("User not found"))
        : success({ id: userId, name: `User ${userId}` }),
      (r) => traceLog.push(`Step 2 (Fetch): ${r.status}`),
    );

    if (userData.status === "error") {
      return tap(userData, (_r) => {
        console.log("Trace log:", traceLog);
      });
    }

    // Step 3: Format result
    const formattedResult = tap(success(`User ${userId} processed successfully`), (r) =>
      traceLog.push(`Step 3 (Format): ${r.status}`),
    );

    // Always log trace at the end
    return tap(formattedResult, (_r) => {
      console.log("Trace log:", traceLog);
    });
  }

  console.log("\nTracing Example:");
  const validUserProcess = processUserData(1);
  const invalidUserProcess = processUserData(-1);
  const notFoundUserProcess = processUserData(42);

  console.log("Valid user result:", validUserProcess);
  console.log("Invalid user result:", invalidUserProcess);
  console.log("Not found user result:", notFoundUserProcess);

  // 3. Caching - Store results without modifying the flow

  // Simple cache implementation
  const cache = new Map<string, any>();

  function fetchWithCache<T>(key: string, fetcher: () => Result<T, Error>): Result<T, Error> {
    console.log(`Requested: ${key}`);

    // Check if result is in cache
    if (cache.has(key)) {
      console.log(`Cache hit for ${key}`);
      return success(cache.get(key));
    }

    // Not in cache, execute fetcher
    console.log(`Cache miss for ${key}, fetching...`);
    const result = fetcher();

    // Store successful results in cache
    return tap(result, (r) => {
      if (r.status === "success") {
        console.log(`Storing ${key} in cache`);
        cache.set(key, r.data);
      }
    });
  }

  console.log("\nCaching Example:");

  // First request - should fetch
  const firstRequest = fetchWithCache("user-1", () => success({ id: 1, name: "John" }));
  console.log("First request result:", firstRequest);

  // Second request - should use cache
  const secondRequest = fetchWithCache("user-1", () => success({ id: 1, name: "John" }));
  console.log("Second request result:", secondRequest);

  // Error result - shouldn't cache
  const errorRequest = fetchWithCache("user-error", () => error(new Error("Failed to fetch")));
  console.log("Error request result:", errorRequest);

  // Try again after error - should fetch again
  const retryRequest = fetchWithCache("user-error", () => success({ id: 999, name: "Retry User" }));
  console.log("Retry request result:", retryRequest);

  console.log("Cache contents:", Object.fromEntries(cache.entries()));

  return {
    successOperation,
    failedOperation,
    metrics,
    validUserProcess,
    invalidUserProcess,
    notFoundUserProcess,
    firstRequest,
    secondRequest,
    errorRequest,
    retryRequest,
    cacheContents: Object.fromEntries(cache.entries()),
  };
}

// Run all examples
function runTapExamples() {
  basicTapExamples();
  dataProcessingExample();
  combinedTransformerExample();
  practicalTapExamples();
}

// Uncomment to run
runTapExamples();
