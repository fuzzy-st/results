/**
 * Examples demonstrating the usage of type guard methods
 * from the Result pattern library.
 */

import { error } from "~/lib/core/error";
import { isError } from "~/lib/core/isError";
import { isResult } from "~/lib/core/isResult";
import { isSuccess } from "~/lib/core/isSuccess";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

/**
 * Example 1: Basic Type Guard Usage
 *
 * Demonstrates how to use type guard methods to check Result types
 */
export function basicTypeGuardExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 1: Basic Type Guard Usage");

  // Create various Result types
  const successResult = success(42);
  const errorResult = error(new Error("Something went wrong"));
  const randomObject = { status: "unknown" };

  // Check if a value is a Result
  console.log("Is successResult a Result?", isResult(successResult));
  console.log("Is errorResult a Result?", isResult(errorResult));
  console.log("Is randomObject a Result?", isResult(randomObject));

  // Check if a Result is a success
  console.log("Is successResult a success?", isSuccess(successResult));
  console.log("Is errorResult a success?", isSuccess(errorResult));

  // Check if a Result is an error
  console.log("Is successResult an error?", isError(successResult));
  console.log("Is errorResult an error?", isError(errorResult));

  return { successResult, errorResult, randomObject };
}

/**
 * Example 2: Type Narrowing with Type Guards
 *
 * Shows how type guards can be used for type narrowing in conditional logic
 */
export function typeNarrowingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 2: Type Narrowing");

  // Function that handles different Result types
  function processResult(result: Result<number, Error>) {
    if (isSuccess(result)) {
      // Type is narrowed to success result
      console.log("Success value:", result.data * 2);
    } else if (isError(result)) {
      // Type is narrowed to error result
      console.log("Error occurred:", result.error.message);
    }
  }

  // Test cases
  const positiveResult = success(21);
  const negativeResult = error(new Error("Calculation failed"));

  processResult(positiveResult);
  processResult(negativeResult);

  return { positiveResult, negativeResult };
}

/**
 * Example 3: Advanced Type Guard Scenarios
 *
 * Demonstrates type guards with different data types and complex scenarios
 */
export function advancedTypeGuardExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 3: Advanced Type Guard Scenarios");

  // Function that works with generic Results
  function safelyProcessData<T, E>(result: Result<T, E>) {
    // Comprehensive type checking
    if (!isResult(result)) {
      console.log("Not a valid Result");
      return null;
    }

    if (isSuccess(result)) {
      console.log("Successful result with data:", result.data);
      return result.data;
    }

    if (isError(result)) {
      console.log("Error result:", result.error);
      return null;
    }
  }

  // Test with various types
  const numberResult = success(42);
  const stringResult = success("Hello, World!");
  const objectResult = success({ name: "John", age: 30 });
  const failedResult = error(new Error("Something went wrong"));

  console.log("Number Result:", safelyProcessData(numberResult));
  console.log("String Result:", safelyProcessData(stringResult));
  console.log("Object Result:", safelyProcessData(objectResult));
  console.log("Failed Result:", safelyProcessData(failedResult));

  return { numberResult, stringResult, objectResult, failedResult };
}

/**
 * Example 4: Type Guards in Filtering and Mapping
 *
 * Shows how type guards can be used with array operations
 */
export function filteringAndMappingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 4: Filtering and Mapping");

  // An array of mixed Results
  const mixedResults: Result<number, Error>[] = [
    success(1),
    error(new Error("First error")),
    success(2),
    error(new Error("Second error")),
    success(3),
  ];

  // Filter out successful results
  const successfulResults = mixedResults.filter(isSuccess);
  console.log("Successful Results:", successfulResults);

  // Extract values from successful results
  const extractedValues = successfulResults.map((result) => result.data);
  console.log("Extracted Values:", extractedValues);

  // Filter out error results
  const errorResults = mixedResults.filter(isError);
  console.log("Error Results:", errorResults);

  // Extract error messages
  const errorMessages = errorResults.map((result) => result.error.message);
  console.log("Error Messages:", errorMessages);

  return { mixedResults, successfulResults, errorResults };
}

// Run all examples
function runExamples() {
  basicTypeGuardExamples();
  typeNarrowingExample();
  advancedTypeGuardExample();
  filteringAndMappingExample();
}

// Uncomment to run
runExamples();
