/**
 * Examples demonstrating the usage of unwrap and unwrapOr methods
 * from the Result pattern library.
 */

import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import { unwrap } from "~/lib/core/unwrap";
import { unwrapOr } from "~/lib/core/unwrapOr";
import type { Result } from "~/types";

/**
 * Example 1: Basic Unwrap Usage
 *
 * Demonstrates how to use unwrap to extract values from successful results
 */
export function basicUnwrapExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 1: Basic Unwrap Usage");

  // Successful result with a number
  const numberResult = success(42);
  try {
    const extractedNumber = unwrap(numberResult);
    console.log("Extracted Number:", extractedNumber);
  } catch (err) {
    console.error("Unexpected error:", err);
  }

  // Successful result with an object
  const userResult = success({ id: 1, name: "John Doe" });
  try {
    const extractedUser = unwrap(userResult);
    console.log("Extracted User:", extractedUser);
  } catch (err) {
    console.error("Unexpected error:", err);
  }

  // Attempting to unwrap an error result (will throw)
  const errorResult = error(new Error("Something went wrong"));
  try {
    const extractedValue = unwrap(errorResult);
    console.log("This will not be reached", extractedValue);
  } catch (err) {
    console.error("Caught expected error:", err);
  }

  return { numberResult, userResult, errorResult };
}

/**
 * Example 2: UnwrapOr Usage
 *
 * Demonstrates how to use unwrapOr to provide default values
 */
export function unwrapOrExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 2: UnwrapOr Usage");

  // Successful result with a number
  const positiveResult = success(42);
  const defaultNumber = unwrapOr(positiveResult, 0);
  console.log("Positive Result Unwrapped:", defaultNumber);

  // Error result with a default number
  const errorNumberResult = error(new Error("Number fetch failed"));
  const fallbackNumber = unwrapOr(errorNumberResult, 0);
  console.log("Error Result Unwrapped:", fallbackNumber);

  // Successful result with an object
  const userResult = success({ id: 1, name: "John Doe" });
  const defaultUser = { id: 0, name: "Guest" };
  const unwrappedUser = unwrapOr(userResult, defaultUser);
  console.log("User Result Unwrapped:", unwrappedUser);

  // Error result with a default object
  const errorUserResult = error(new Error("User fetch failed"));
  const unwrappedFallbackUser = unwrapOr(errorUserResult, defaultUser);
  console.log("Error User Result Unwrapped:", unwrappedFallbackUser);

  return {
    positiveResult,
    errorNumberResult,
    userResult,
    errorUserResult,
  };
}

/**
 * Example 3: Advanced Unwrap Scenarios
 *
 * Demonstrates unwrap and unwrapOr in complex validation scenarios
 */
export function advancedUnwrapExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 3: Advanced Unwrap Scenarios");

  // Validation function returning a Result
  function validateAndProcessAge(age: number): Result<number, Error> {
    if (age < 0) {
      return error(new Error("Age cannot be negative"));
    }
    if (age > 120) {
      return error(new Error("Age is unrealistically high"));
    }
    return success(age);
  }

  // Successful validation
  const validAgeResult = validateAndProcessAge(30);
  try {
    const processedAge = unwrap(validAgeResult);
    console.log("Processed Valid Age:", processedAge);
  } catch (err) {
    console.error("Unexpected error:", err);
  }

  // Failed validation with unwrapOr
  const invalidAgeResult = validateAndProcessAge(-5);
  const safeAge = unwrapOr(invalidAgeResult, 18);
  console.log("Processed Invalid Age:", safeAge);

  return { validAgeResult, invalidAgeResult };
}

/**
 * Example 4: Unwrap in Async Operations
 *
 * Shows how unwrap and unwrapOr can be used with async results
 */
export async function asyncUnwrapExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 4: Async Unwrap");

  // Simulated async operation returning a Result
  async function fetchUserData(id: number): Promise<Result<{ name: string }, Error>> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (id <= 0) {
      return error(new Error("Invalid user ID"));
    }

    return success({ name: "John Doe" });
  }

  // Successful async result
  const validUserResult = await fetchUserData(42);
  try {
    const userData = unwrap(validUserResult);
    console.log("Async Unwrap - Valid User:", userData);
  } catch (err) {
    console.error("Unexpected async error:", err);
  }

  // Failed async result with unwrapOr
  const invalidUserResult = await fetchUserData(-1);
  const fallbackUser = unwrapOr(invalidUserResult, { name: "Guest" });
  console.log("Async UnwrapOr - Fallback User:", fallbackUser);

  return { validUserResult, invalidUserResult };
}

// Run all examples
async function _runExamples() {
  basicUnwrapExamples();
  unwrapOrExamples();
  advancedUnwrapExample();
  await asyncUnwrapExample();
}

// Uncomment to run
// await runExamples();
