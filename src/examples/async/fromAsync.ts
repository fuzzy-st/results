/**
 * Examples demonstrating the usage of the fromAsync method
 * from the Result pattern library.
 */

import { fromAsync } from "~/lib/async/fromAsync";
import { match } from "~/lib/core/match";
import { isSuccess } from "~/lib/core/isSuccess";

/**
 * Example 1: Basic Async Function Wrapping
 * 
 * Demonstrates how to wrap simple async functions to return Results
 */
export async function basicAsyncExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 1: Basic Async Function Wrapping");

    // A simple async function that might throw
    async function fetchNumber(shouldSucceed: boolean): Promise<number> {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay

        if (!shouldSucceed) {
            throw new Error("Failed to fetch number");
        }

        return 42;
    }

    // Wrap the function
    const safeFetchNumber = fromAsync(fetchNumber);

    // Success case
    console.log("Calling with shouldSucceed = true");
    const successResult = await safeFetchNumber(true);
    console.log("Success Result:", successResult);

    // Error case
    console.log("\nCalling with shouldSucceed = false");
    const errorResult = await safeFetchNumber(false);
    console.log("Error Result:", errorResult);

    // Use match to handle both cases
    console.log("\nUsing match to handle success case:");
    const successMessage = match(successResult, {
        success: value => `The answer is ${value}`,
        error: err => `Error: ${err.message}`
    });
    console.log(successMessage);

    console.log("\nUsing match to handle error case:");
    const errorMessage = match(errorResult, {
        success: value => `The answer is ${value}`,
        error: err => `Error: ${err.message}`
    });
    console.log(errorMessage);

    return { successResult, errorResult };
}

/**
 * Example 2: API Request Wrapper
 * 
 * Shows how to create API functions that safely handle errors
 */
export async function apiWrapperExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 2: API Request Wrapper");

    // Simulated database of users
    const users = {
        "1": { id: "1", name: "Alice", email: "alice@example.com" },
        "2": { id: "2", name: "Bob", email: "bob@example.com" }
    };

    // Simulated API functions
    async function fetchUser(id: string) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay

        if (!id) {
            throw new Error("User ID is required");
        }

        const user = users[id];
        if (!user) {
            throw new Error(`User with ID ${id} not found`);
        }

        return user;
    }

    async function updateUser(id: string, data: Partial<typeof users[string]>) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay

        if (!id) {
            throw new Error("User ID is required");
        }

        const user = users[id];
        if (!user) {
            throw new Error(`User with ID ${id} not found`);
        }

        // Update the user
        const updatedUser = { ...user, ...data };
        users[id] = updatedUser;

        return updatedUser;
    }

    // Wrap the API functions
    const safeGetUser = fromAsync(fetchUser);
    const safeUpdateUser = fromAsync(updateUser);

    // Use the wrapped functions
    console.log("Fetching existing user (ID: 1)...");
    const existingUserResult = await safeGetUser("1");
    console.log("Existing User Result:", existingUserResult);

    console.log("\nFetching non-existent user (ID: 999)...");
    const nonExistentUserResult = await safeGetUser("999");
    console.log("Non-existent User Result:", nonExistentUserResult);

    console.log("\nUpdating user with valid data...");
    if (isSuccess(existingUserResult)) {
        const updateResult = await safeUpdateUser("1", {
            name: "Alice Updated"
        });
        console.log("Update Result:", updateResult);
    }

    return { existingUserResult, nonExistentUserResult };
}

/**
 * Example 3: Form Submission Handler
 * 
 * Demonstrates using fromAsync to handle form submissions
 */
export async function formSubmissionExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 3: Form Submission Handler");

    // Define form types
    interface FormData {
        username: string;
        email: string;
        age: number;
    }

    // Original form submission function with validation
    async function submitForm(data: FormData): Promise<{ id: string, success: boolean }> {
        console.log("Validating form data...");

        if (!data.username || data.username.length < 3) {
            throw new Error("Username must be at least 3 characters");
        }

        if (!data.email || !data.email.includes('@')) {
            throw new Error("Invalid email format");
        }

        if (!data.age || data.age < 18) {
            throw new Error("You must be at least 18 years old");
        }

        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

        // Simulate successful submission
        console.log("Form submitted successfully!");
        return { id: "form-" + Date.now(), success: true };
    }

    // Wrap for safety
    const safeSubmitForm = fromAsync(submitForm);

    // Test with valid data
    const validForm: FormData = {
        username: "johndoe",
        email: "john@example.com",
        age: 25
    };

    console.log("Submitting valid form data...");
    const validResult = await safeSubmitForm(validForm);

    if (isSuccess(validResult)) {
        console.log(`Form submitted successfully with ID: ${validResult.data.id}`);
    } else {
        console.error(`Form submission failed: ${validResult.error.message}`);
    }

    // Test with invalid data
    const invalidForm: FormData = {
        username: "jo", // Too short
        email: "invalid-email", // Missing @
        age: 16 // Under 18
    };

    console.log("\nSubmitting invalid form data...");
    const invalidResult = await safeSubmitForm(invalidForm);

    if (isSuccess(invalidResult)) {
        console.log(`Form submitted successfully with ID: ${invalidResult.data.id}`);
    } else {
        console.error(`Form submission failed: ${invalidResult.error.message}`);
    }

    return { validResult, invalidResult };
}

/**
 * Example 4: Complex Chained Operations
 * 
 * Shows how to handle complex chained async operations
 */
export async function chainedOperationsExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 4: Complex Chained Operations");

    // A series of dependent async operations
    async function fetchData(id: string): Promise<string[]> {
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!id) throw new Error("ID is required");

        return ["data1", "data2", "data3"];
    }

    async function processData(data: string[]): Promise<number[]> {
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Valid data array is required");
        }

        return data.map(item => item.length);
    }

    async function calculateTotal(numbers: number[]): Promise<number> {
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!Array.isArray(numbers) || numbers.length === 0) {
            throw new Error("Valid numbers array is required");
        }

        return numbers.reduce((sum, num) => sum + num, 0);
    }

    // Wrap each function
    const safeFetchData = fromAsync(fetchData);
    const safeProcessData = fromAsync(processData);
    const safeCalculateTotal = fromAsync(calculateTotal);

    // Chain the operations
    console.log("Executing operation chain with valid ID...");
    const fetchResult = await safeFetchData("valid-id");

    if (isSuccess(fetchResult)) {
        console.log("Fetch successful:", fetchResult.data);

        const processResult = await safeProcessData(fetchResult.data);

        if (isSuccess(processResult)) {
            console.log("Processing successful:", processResult.data);

            const totalResult = await safeCalculateTotal(processResult.data);

            if (isSuccess(totalResult)) {
                console.log("Calculation successful, total:", totalResult.data);
                return { success: true, total: totalResult.data };
            } else {
                console.error("Calculation failed:", totalResult.error.message);
                return { success: false, error: totalResult.error };
            }
        } else {
            console.error("Processing failed:", processResult.error.message);
            return { success: false, error: processResult.error };
        }
    } else {
        console.error("Fetch failed:", fetchResult.error.message);
        return { success: false, error: fetchResult.error };
    }
}

// Run all examples
async function runFromAsyncExamples() {
    await basicAsyncExample();
    await apiWrapperExample();
    await formSubmissionExample();
    await chainedOperationsExample();
}

// Uncomment to run the examples
await runFromAsyncExamples();