/**
 * Examples demonstrating the usage of the pipe method
 * from the Result pattern library.
 */

import { pipe } from "~/lib/transformers/pipe";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";
import { map } from "~/lib/transformers/map";
import { chain } from "~/lib/transformers/chain";
import type { Result } from "~/types";

/**
 * Example 1: Basic Pipe Usage
 * 
 * Demonstrates the basic usage of pipe for creating transformation pipelines
 */
export function basicPipeExamples() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 1: Basic Pipe Usage");

    // Simple numeric transformations
    const doubleAndAdd = pipe(
        5,
        value => success(value * 2),
        value => success(value + 1)
    );
    console.log("Double and add one to 5:", doubleAndAdd);

    // String transformations
    const stringPipeline = pipe(
        "hello",
        value => success(value.toUpperCase()),
        value => success(value + " WORLD"),
        value => success(value.length)
    );
    console.log("String pipeline result:", stringPipeline);

    // Starting with a Result
    const resultPipeline = pipe(
        success(42),
        value => success(value / 2),
        value => success(`The answer is ${value}`)
    );
    console.log("Pipeline starting with a Result:", resultPipeline);

    // Error short-circuiting
    const errorPipeline = pipe(
        10,
        value => value > 20 ? success(value) : error(new Error("Value too small")),
        value => success(value * 2) // This won't execute
    );
    console.log("Pipeline with error:", errorPipeline);

    return { doubleAndAdd, stringPipeline, resultPipeline, errorPipeline };
}

/**
 * Example 2: Data Validation Pipeline
 * 
 * Shows how to use pipe for input validation
 */
// Create a more complex validation pipeline for user data
interface UserInput {
    name: string;
    email: string;
    age: string; // String because it comes from form input
}

interface ValidatedUser {
    name: string;
    email: string;
    age: number; // Parsed to number
}
export function validationPipelineExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 2: Data Validation Pipeline");

    // Define validation functions
    function validateNonEmpty(input: string): Result<string, Error> {
        return input.trim().length > 0
            ? success(input.trim())
            : error(new Error("Input cannot be empty"));
    }

    function validateMinLength(minLength: number) {
        return (input: string): Result<string, Error> => {
            return input.length >= minLength
                ? success(input)
                : error(new Error(`Input must be at least ${minLength} characters`));
        };
    }

    function validateEmail(input: string): Result<string, Error> {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input)
            ? success(input)
            : error(new Error("Invalid email format"));
    }

    function sanitizeEmail(input: string): Result<string, Error> {
        return success(input.toLowerCase());
    }

    // Create validation pipeline
    function validateUserEmail(email: string): Result<string, Error> {
        return pipe(
            email,
            validateNonEmpty,
            validateMinLength(5),
            validateEmail,
            sanitizeEmail
        );
    }

    // Test with various inputs
    console.log("Valid email:", validateUserEmail("User@Example.com"));
    console.log("Empty input:", validateUserEmail("  "));
    console.log("Too short:", validateUserEmail("a@b.c"));
    console.log("Invalid format:", validateUserEmail("not-an-email"));



    function validateUserData(input: UserInput): Result<ValidatedUser, Error> {
        // Name validation
        const nameResult = pipe(
            input.name,
            validateNonEmpty,
            validateMinLength(2)
        );

        if (nameResult.status === "error") {
            return error(new Error(`Name validation failed: ${nameResult.error.message}`));
        }

        // Email validation
        const emailResult = validateUserEmail(input.email);
        if (emailResult.status === "error") {
            return error(new Error(`Email validation failed: ${emailResult.error.message}`));
        }

        // Age validation
        const ageResult = pipe(
            input.age,
            value => {
                const parsedAge = Number.parseInt(value, 10);
                return isNaN(parsedAge)
                    ? error(new Error("Age must be a number"))
                    : success(parsedAge);
            },
            age => {
                return age >= 18 && age <= 120
                    ? success(age)
                    : error(new Error("Age must be between 18 and 120"));
            }
        );

        if (ageResult.status === "error") {
            return error(new Error(`Age validation failed: ${ageResult.error.message}`));
        }

        // All validations passed, return validated user
        return success({
            name: nameResult.data,
            email: emailResult.data,
            age: ageResult.data
        });
    }

    // Test user validation
    const validUser = {
        name: "John Doe",
        email: "john.doe@example.com",
        age: "30"
    };

    const invalidUser = {
        name: "J",
        email: "not-an-email",
        age: "seventeen"
    };

    console.log("\nValid user data:", validateUserData(validUser));
    console.log("Invalid user data:", validateUserData(invalidUser));

    return {
        validateUserEmail,
        validateUserData,
        examples: {
            validEmail: validateUserEmail("User@Example.com"),
            emptyInput: validateUserEmail("  "),
            tooShort: validateUserEmail("a@b.c"),
            invalidFormat: validateUserEmail("not-an-email"),
            validUser: validateUserData(validUser),
            invalidUser: validateUserData(invalidUser)
        }
    };
}

/**
 * Example 3: API Request Pipeline
 * 
 * Demonstrates using pipe for a typical API request flow
 */
// Define our domain types
interface ApiRequest {
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    params?: Record<string, string>;
    body?: any;
}

interface ApiResponse<T> {
    status: number;
    data: T;
    headers: Record<string, string>;
}

interface User {
    id: number;
    name: string;
    email: string;
}
export function apiRequestPipelineExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 3: API Request Pipeline");


    // Mock API service
    const mockApi = {
        users: {
            "1": { id: 1, name: "Alice", email: "alice@example.com" },
            "2": { id: 2, name: "Bob", email: "bob@example.com" }
        },
        posts: {
            "101": { id: 101, userId: 1, title: "Alice's Post", body: "Hello world!" },
            "102": { id: 102, userId: 1, title: "Another Post", body: "Still here!" },
            "201": { id: 201, userId: 2, title: "Bob's Post", body: "Hi there!" }
        }
    };

    // API pipeline operations
    function validateRequest(request: ApiRequest): Result<ApiRequest, Error> {
        if (!request.endpoint) {
            return error(new Error("Endpoint is required"));
        }

        if (!request.method) {
            return error(new Error("Method is required"));
        }

        return success(request);
    }

    function authenticateRequest(request: ApiRequest): Result<ApiRequest, Error> {
        // In a real app, check auth token, etc.
        // For the example, we'll just simulate authentication
        const isAuthenticated = true;

        return isAuthenticated
            ? success(request)
            : error(new Error("Unauthorized"));
    }

    function executeRequest<T>(request: ApiRequest): Result<ApiResponse<T>, Error> {
        // Parse endpoint and validate
        const parts = request.endpoint.split("/").filter(Boolean);

        if (parts.length < 2) {
            return error(new Error(`Invalid endpoint: ${request.endpoint}`));
        }

        const [resource, id] = parts;

        // Check if resource exists
        if (!(resource in mockApi)) {
            return error(new Error(`Resource not found: ${resource}`));
        }

        // Handle GET requests
        if (request.method === "GET") {
            // Get by ID
            if (id) {
                const item = (mockApi[resource as keyof typeof mockApi] as Record<string, any>)[id];
                if (!item) {
                    return error(new Error(`${resource} with ID ${id} not found`));
                }

                return success({
                    status: 200,
                    data: item as T,
                    headers: {
                        "content-type": "application/json"
                    }
                });
            }

            // List all
            return success({
                status: 200,
                data: Object.values(mockApi[resource as keyof typeof mockApi]) as T,
                headers: {
                    "content-type": "application/json"
                }
            });
        }

        // For simplicity, we'll just implement GET
        return error(new Error(`Method ${request.method} not implemented`));
    }

    function processResponse<T, R>(
        response: ApiResponse<T>,
        processor: (data: T) => R
    ): Result<R, Error> {
        try {
            return success(processor(response.data));
        } catch (err) {
            return error(
                err instanceof Error
                    ? err
                    : new Error("Error processing response")
            );
        }
    }

    // Create API request pipeline
    function apiRequest<T, R>(
        request: ApiRequest,
        processor: (data: T) => R
    ): Result<R, Error> {
        return pipe(
            request,
            validateRequest,
            authenticateRequest,
            req => executeRequest<T>(req),
            resp => processResponse(resp, processor)
        );
    }

    // Example usage
    console.log("\nFetching user by ID:");
    const userRequest = {
        endpoint: "/users/1",
        method: "GET" as const
    } as const;


    const userResult = apiRequest<User, string>(userRequest, user => `User: ${user.name} (${user.email})`);
    console.log("User request result:", userResult);

    console.log("\nFetching non-existent user:");
    const badUserRequest = {
        endpoint: "/users/999",
        method: "GET" as const
    };

    const badUserResult = apiRequest<User, string>(badUserRequest, user => `User: ${user.name}`);
    console.log("Bad user request result:", badUserResult);

    console.log("\nFetching user's posts:");
    // Here we'll demonstrate a more complex pipeline where we fetch a user's posts
    function getUserPosts(userId: string) {
        // First fetch the user
        return pipe(
            { endpoint: `/users/${userId}`, method: "GET" as const },
            validateRequest,
            authenticateRequest,
            req => executeRequest(req),
            userResponse => {
                const user = userResponse.data;

                // Then fetch all posts
                return pipe(
                    { endpoint: "/posts", method: "GET" as const },
                    validateRequest,
                    authenticateRequest,
                    req => executeRequest<any[]>(req),
                    postsResponse => {
                        // Filter posts by user ID
                        const userPosts = postsResponse.data.filter(
                            (post: { userId: any; }) => post.userId === user.id
                        );

                        return success({
                            user,
                            posts: userPosts
                        });
                    }
                );
            }
        );
    }

    const userPostsResult = getUserPosts("1");
    console.log("User posts result:", userPostsResult);

    return {
        userResult,
        badUserResult,
        userPostsResult,
        apiRequest
    };
}

/**
 * Example 4: Railway-Oriented Programming
 * 
 * Shows how pipe implements the Railway-Oriented Programming pattern
 */
export function railwayProgrammingExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 4: Railway-Oriented Programming");

    // In Railway-Oriented Programming:
    // - Functions are like railway switches
    // - Success track continues straight
    // - Error track diverts to a parallel error track
    // - Once on the error track, you stay there

    // Define some railway switches (functions that can fail)
    function validatePositive(x: number): Result<number, Error> {
        return x > 0
            ? success(x)
            : error(new Error(`Value ${x} is not positive`));
    }

    function requireEven(x: number): Result<number, Error> {
        return x % 2 === 0
            ? success(x)
            : error(new Error(`Value ${x} is not even`));
    }

    function requireFactor(factor: number) {
        return (x: number): Result<number, Error> => {
            return x % factor === 0
                ? success(x)
                : error(new Error(`Value ${x} is not divisible by ${factor}`));
        };
    }

    function double(x: number) {
        return success(x * 2);
    }

    function addOne(x: number) {
        return success(x + 1);
    }

    // Create railway with pipe
    const processNumber = (x: number) => pipe(
        x,
        validatePositive,     // First switch: check if positive
        requireEven,          // Second switch: check if even
        requireFactor(4),     // Third switch: check if divisible by 4
        double,               // Transform: double the value
        addOne                // Transform: add one
    );

    // Visualize each step of the pipeline for different inputs
    function visualizeRailway(input: number) {
        const steps = [
            { name: "Initial", fn: (x: number) => success(x) },
            { name: "Validate Positive", fn: validatePositive },
            { name: "Require Even", fn: requireEven },
            { name: "Require Factor of 4", fn: requireFactor(4) },
            { name: "Double", fn: double },
            { name: "Add One", fn: addOne }
        ];

        console.log(`\nProcessing input: ${input}`);
        console.log("Railway visualization:");

        let currentValue = input;
        let currentResult: Result<number, Error> = success(currentValue);
        let stoppedAtStep = -1;

        for (const [i, step] of steps.entries()) {
            console.log(`Step ${i}: ${step.name}`);
            // Skip execution if already on error track
            if (currentResult.status === "error") {
                console.log(`  [Error Track] Skipping - Already on error track`);
                continue;
            }

            // Apply the transformation
            currentResult = step.fn(currentValue);
            // Show the result
            if (currentResult.status === "success") {
                currentValue = currentResult.data;
                console.log(`  [Success Track] Result: ${currentValue}`);
            } else {
                stoppedAtStep = i;
                console.log(`  [Error Track] Error: ${currentResult.error.message}`);
            }
        }

        console.log(`Final result: ${currentResult.status === "success"
            ? `Success: ${currentResult.data}`
            : `Error at step ${stoppedAtStep}: ${currentResult.error.message}`
            }`);

        return currentResult;
    }

    // Test with various inputs
    console.log("Example 1: Happy path");
    const validResult = processNumber(8);
    console.log("Final result:", validResult);

    // Visualize different inputs
    visualizeRailway(8);  // Should succeed (positive, even, divisible by 4)
    visualizeRailway(-2); // Should fail at validatePositive
    visualizeRailway(3);  // Should fail at requireEven
    visualizeRailway(6);  // Should fail at requireFactor(4)

    // Chaining railways together
    console.log("\nChaining railways together:");

    function processStringToNumber(input: string) {
        return pipe(
            input,
            str => {
                const parsed = Number.parseInt(str, 10);
                return isNaN(parsed)
                    ? error(new Error(`Cannot parse "${str}" as number`))
                    : success(parsed);
            }
        );
    }

    function fullProcess(input: string) {
        return pipe(
            input,
            // First railway: parse string to number
            value => processStringToNumber(value),
            // Second railway: process the number
            value => processNumber(value)
        );
    }

    console.log("\nFull process with valid input:");
    const fullValidResult = fullProcess("8");
    console.log("Result:", fullValidResult);

    console.log("\nFull process with non-parseable input:");
    const notANumberResult = fullProcess("not a number");
    console.log("Result:", notANumberResult);

    console.log("\nFull process with invalid number input:");
    const invalidNumberResult = fullProcess("3");
    console.log("Result:", invalidNumberResult);

    return {
        processNumber,
        validResult,
        railways: {
            positive: visualizeRailway(8),
            negative: visualizeRailway(-2),
            odd: visualizeRailway(3),
            notDivisible: visualizeRailway(6)
        },
        fullProcess: {
            valid: fullValidResult,
            notANumber: notANumberResult,
            invalidNumber: invalidNumberResult
        }
    };
}

// Run all examples
function runPipeExamples() {
    basicPipeExamples();
    validationPipelineExample();
    apiRequestPipelineExample();
    railwayProgrammingExample();
}

// Uncomment to run
// runPipeExamples();