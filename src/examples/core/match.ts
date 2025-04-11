/**
 * Examples demonstrating the usage of the match method
 * from the Result pattern library.
 */

import { match } from "~/lib/core/match";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";
import type { Result } from "~/types";

/**
 * Example 1: Basic Match Usage
 * 
 * Demonstrates how to use match with different result types
 */
export function basicMatchExamples() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 1: Basic Match Usage");

    // Match with a successful result
    const successResult = success(42);
    const successOutput = match(successResult, {
        success: (value) => `Success with value: ${value}`,
        error: (err) => `Error: ${err.message}`
    });
    console.log("Success Result Match:", successOutput);

    // Match with an error result
    const errorResult = error(new Error("Something went wrong"));
    const errorOutput = match(errorResult, {
        success: (value) => `Success with value: ${value}`,
        error: (err) => `Error: ${err.message}`
    });
    console.log("Error Result Match:", errorOutput);

    return { successResult, errorResult };
}

/**
 * Example 2: Complex Type Matching
 * 
 * Shows match working with different data types and complex scenarios
 */
export function complexTypeMatchExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 2: Complex Type Matching");

    // User validation function returning a Result
    function validateUser(user: { name: string, age: number }): Result<{ name: string, age: number }, Error> {
        if (user.name.trim() === '') {
            return error(new Error("Name cannot be empty"));
        }
        if (user.age < 0 || user.age > 120) {
            return error(new Error("Invalid age"));
        }
        return success(user);
    }

    // Test cases with different users
    const validUser = { name: "John Doe", age: 30 };
    const invalidUser = { name: "", age: 150 };

    const validUserResult = validateUser(validUser);
    const validUserOutput = match(validUserResult, {
        success: (user) => `Valid user: ${user.name}, Age: ${user.age}`,
        error: (err) => `Validation failed: ${err.message}`
    });
    console.log("Valid User Result:", validUserOutput);

    const invalidUserResult = validateUser(invalidUser);
    const invalidUserOutput = match(invalidUserResult, {
        success: (user) => `Valid user: ${user.name}, Age: ${user.age}`,
        error: (err) => `Validation failed: ${err.message}`
    });
    console.log("Invalid User Result:", invalidUserOutput);

    return { validUserResult, invalidUserResult };
}

/**
 * Example 3: Async Operations with Match
 * 
 * Demonstrates match in asynchronous contexts
 */
export async function asyncMatchExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 3: Async Operations with Match");

    // Simulated async data fetching function
    async function fetchData(id: number): Promise<Result<string, Error>> {
        await new Promise(resolve => setTimeout(resolve, 100));

        if (id <= 0) {
            return error(new Error("Invalid ID"));
        }

        return success(`Data for ID: ${id}`);
    }

    // Successful async result
    const successfulFetch = await fetchData(42);
    const successfulOutput = match(successfulFetch, {
        success: (data) => `Fetch successful: ${data}`,
        error: (err) => `Fetch failed: ${err.message}`
    });
    console.log("Successful Fetch:", successfulOutput);

    // Failed async result
    const failedFetch = await fetchData(-1);
    const failedOutput = match(failedFetch, {
        success: (data) => `Fetch successful: ${data}`,
        error: (err) => `Fetch failed: ${err.message}`
    });
    console.log("Failed Fetch:", failedOutput);

    return { successfulFetch, failedFetch };
}

/**
 * Example 4: Advanced Matching Scenarios
 * 
 * Shows advanced use cases of match with different callback strategies
 */
export function advancedMatchExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 4: Advanced Matching Scenarios");

    // Function with complex result processing
    function processPayment(amount: number): Result<number, Error> {
        if (amount < 0) {
            return error(new Error("Invalid payment amount"));
        }
        if (amount > 1000) {
            return error(new Error("Payment exceeds maximum limit"));
        }
        return success(amount);
    }

    // Different matching strategies
    const paymentResults = [
        processPayment(500),   // Valid payment
        processPayment(-100),  // Negative amount
        processPayment(1500)   // Excessive amount
    ];

    const processedResults = paymentResults.map(result =>
        match(result, {
            success: (amount) => ({
                status: 'processed',
                amount,
                fee: amount * 0.02  // Calculate processing fee
            }),
            error: (err) => ({
                status: 'failed',
                reason: err.message,
                amount: 0
            })
        })
    );

    console.log("Processed Payment Results:", processedResults);

    return { paymentResults, processedResults };
}

// Run all examples
async function runExamples() {
    basicMatchExamples();
    complexTypeMatchExample();
    await asyncMatchExample();
    advancedMatchExample();
}

// Uncomment to run
await runExamples();