/**
 * Examples demonstrating the usage of the asyncMap method
 * from the Result pattern library.
 */

import { asyncMap } from "~/lib/async/asyncMap";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";
import { isSuccess } from "~/lib/core/isSuccess";
import { isError } from "~/lib/core/isError";

/**
 * Example 1: Basic Async Transformation
 * 
 * Demonstrates how to transform a success value using an async function
 */
export async function basicAsyncMapExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 1: Basic Async Transformation");

    // Create a success result with a number value
    const numberResult = success(42);

    // Define an async transformation function that doubles the number
    const asyncDouble = async (x: number): Promise<number> => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));
        return x * 2;
    };

    // Apply the async transformation
    console.log("Original result:", numberResult);
    console.log("Applying asyncDouble...");

    const doubledResult = await asyncMap(numberResult, asyncDouble);
    console.log("Transformed result:", doubledResult);

    // Define another async transformation
    const asyncAddOne = async (x: number): Promise<number> => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));
        return x + 1;
    };

    // Chain transformations
    console.log("\nChaining transformations...");
    const finalResult = await asyncMap(
        doubledResult,
        asyncAddOne
    );

    console.log("Final result:", finalResult);

    // Test with error result to demonstrate short-circuiting
    const errorResult = error(new Error("Original error"));
    console.log("\nTesting with error result:");
    console.log("Error result:", errorResult);

    const transformedError = await asyncMap(errorResult, asyncDouble);
    console.log("Transformed error result:", transformedError);
    console.log("Notice the original error is preserved, and asyncDouble was not called.");

    return { numberResult, doubledResult, finalResult, errorResult, transformedError };
}

/**
 * Example 2: User Data Enrichment
 * 
 * Shows how to use asyncMap to enrich user data with asynchronously fetched details
 */
interface User {
    id: number;
    name: string;
}

interface Post {
    id: number;
    title: string;
    body: string;
}

interface UserWithPosts {
    id: number;
    name: string;
    posts: Post[];
}

export async function userDataEnrichmentExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 2: User Data Enrichment");

    // Simulated database of users and posts
    const users = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" }
    ];

    const posts = [
        { id: 101, userId: 1, title: "Alice's first post", body: "Hello world!" },
        { id: 102, userId: 1, title: "Alice's second post", body: "Still here!" },
        { id: 201, userId: 2, title: "Bob's post", body: "Hi everyone!" }
    ];

    // Function to fetch a user by ID
    function findUser(id: number) {
        const user = users.find(u => u.id === id);
        return user
            ? success(user)
            : error(new Error(`User with ID ${id} not found`));
    }

    // Function to asynchronously fetch posts for a user
    async function fetchUserPosts(user: User): Promise<UserWithPosts> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // Find posts for this user
        const userPosts = posts.filter(p => p.userId === user.id);

        return {
            ...user,
            posts: userPosts
        };
    }

    // Get user and enrich with posts
    console.log("Fetching user with ID 1...");
    const userResult = findUser(1);

    if (isSuccess(userResult)) {
        console.log("User found:", userResult.data);
        console.log("Fetching posts for this user...");

        const enrichedResult = await asyncMap(userResult, fetchUserPosts);

        if (isSuccess(enrichedResult)) {
            console.log("Enriched user data:", enrichedResult.data);
            console.log(`User ${enrichedResult.data.name} has ${enrichedResult.data.posts.length} posts.`);
        }
    }

    // Try with non-existent user
    console.log("\nFetching non-existent user with ID 999...");
    const notFoundResult = findUser(999);

    if (isError(notFoundResult)) {
        console.log("User not found:", notFoundResult.error.message);

        // Even though user is not found, we can still try to enrich
        // This demonstrates how asyncMap short-circuits for error results
        console.log("Attempting to enrich anyway...");

        const enrichedNotFound = await asyncMap(notFoundResult, fetchUserPosts);
        console.log("Result:", enrichedNotFound);
        console.log("Original error is preserved and fetchUserPosts was not called.");
    }

    // Try with user who has no posts
    console.log("\nFetching user with ID 3 (who has no posts)...");
    const noPostsUserResult = findUser(3);

    if (isSuccess(noPostsUserResult)) {
        console.log("User found:", noPostsUserResult.data);
        console.log("Fetching posts for this user...");

        const enrichedNoPostsResult = await asyncMap(noPostsUserResult, fetchUserPosts);

        if (isSuccess(enrichedNoPostsResult)) {
            console.log("Enriched user data:", enrichedNoPostsResult.data);
            console.log(`User ${enrichedNoPostsResult.data.name} has ${enrichedNoPostsResult.data.posts.length} posts.`);
        }
    }

    return { userResult, notFoundResult, noPostsUserResult };
}

/**
 * Example 3: Error Handling in Async Transformations
 * 
 * Shows how errors in async transformations are handled
 */
export async function errorHandlingExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 3: Error Handling in Async Transformations");

    // Create a success result
    const successResult = success("https://api.example.com/data");

    // Async function that simulates a fetch that might fail
    async function fetchData(url: string): Promise<object> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 150));

        // Simulate failure for specific URLs
        if (url.includes("error")) {
            throw new Error("Failed to fetch data");
        }

        // Succeed for other URLs
        return { url, data: "Sample data", timestamp: new Date().toISOString() };
    }

    // Try with a URL that will succeed
    console.log("Fetching from valid URL...");
    const fetchResult = await asyncMap(successResult, fetchData);

    if (isSuccess(fetchResult)) {
        console.log("Fetch succeeded:", fetchResult.data);
    } else {
        console.error("Fetch failed:", fetchResult.error.message);
    }

    // Try with a URL that will fail
    console.log("\nFetching from URL that will trigger an error...");
    const errorUrlResult = success("https://api.example.com/error");

    const errorFetchResult = await asyncMap(errorUrlResult, fetchData);

    if (isSuccess(errorFetchResult)) {
        console.log("Fetch succeeded:", errorFetchResult.data);
    } else {
        console.error("Fetch failed:", errorFetchResult.error.message);
        console.log("The error from the async function is properly captured as a Result error.");
    }

    // Function that returns a rejected promise
    async function fetchWithRejection(url: string): Promise<object> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 150));

        return Promise.reject(new Error("Promise explicitly rejected"));
    }

    console.log("\nTesting with function that returns a rejected promise...");
    const rejectionResult = await asyncMap(successResult, fetchWithRejection);

    if (isError(rejectionResult)) {
        console.error("Rejected promise caught:", rejectionResult.error.message);
    }

    return { fetchResult, errorFetchResult, rejectionResult };
}

/**
 * Example 4: Real-World Data Processing Pipeline
 * 
 * Shows how to use asyncMap in a data processing pipeline
 */
export async function dataPipelineExample() {
    console.log(Array.from({ length: 20 }, () => "-").join(""));
    console.log("Example 4: Real-World Data Processing Pipeline");

    // Sample raw data
    const rawDataResult = success([
        { id: 1, name: "Product A", price: "10.99" },
        { id: 2, name: "Product B", price: "24.99" },
        { id: 3, name: "Product C", price: "5.99" }
    ]);

    // Step 1: Parse the data (convert string prices to numbers)
    async function parseData(rawData: any[]): Promise<any[]> {
        console.log("Parsing data...");
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time

        return rawData.map(item => ({
            ...item,
            price: Number.parseFloat(item.price)
        }));
    }

    // Step 2: Enrich the data (add calculated fields)
    async function enrichData(parsedData: any[]): Promise<any[]> {
        console.log("Enriching data...");
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time

        return parsedData.map(item => ({
            ...item,
            priceWithTax: item.price * 1.2,
            discount: item.price > 20 ? 0.1 : 0,
            inStock: true
        }));
    }

    // Step 3: Transform for display
    async function formatForDisplay(enrichedData: any[]): Promise<any[]> {
        console.log("Formatting for display...");
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time

        return enrichedData.map(item => ({
            ...item,
            displayPrice: `$${item.price.toFixed(2)}`,
            displayPriceWithTax: `$${item.priceWithTax.toFixed(2)}`,
            displayDiscount: item.discount > 0 ? `${(item.discount * 100).toFixed(0)}%` : 'None',
            availability: item.inStock ? 'In Stock' : 'Out of Stock'
        }));
    }

    // Execute the pipeline
    console.log("Starting data processing pipeline...");
    console.log("Raw data:", rawDataResult);

    // Step 1: Parse
    const parsedResult = await asyncMap(rawDataResult, parseData);

    if (isError(parsedResult)) {
        console.error("Pipeline failed at parsing step:", parsedResult.error.message);
        return { success: false, error: parsedResult.error };
    }

    console.log("Parsed data:", parsedResult.data);

    // Step 2: Enrich
    const enrichedResult = await asyncMap(parsedResult, enrichData);

    if (isError(enrichedResult)) {
        console.error("Pipeline failed at enrichment step:", enrichedResult.error.message);
        return { success: false, error: enrichedResult.error };
    }

    console.log("Enriched data:", enrichedResult.data);

    // Step 3: Format
    const formattedResult = await asyncMap(enrichedResult, formatForDisplay);

    if (isError(formattedResult)) {
        console.error("Pipeline failed at formatting step:", formattedResult.error.message);
        return { success: false, error: formattedResult.error };
    }

    console.log("Formatted data:", formattedResult.data);
    console.log("Pipeline completed successfully!");

    return {
        success: true,
        rawData: rawDataResult.data,
        parsedData: parsedResult.data,
        enrichedData: enrichedResult.data,
        formattedData: formattedResult.data
    };
}

// Run all examples
async function runAsyncMapExamples() {
    await basicAsyncMapExample();
    await userDataEnrichmentExample();
    await errorHandlingExample();
    await dataPipelineExample();
}

// Uncomment to run the examples
await runAsyncMapExamples();