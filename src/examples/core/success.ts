/**
 * Examples demonstrating the usage of the success method
 * from the Result pattern library.
 */

import { success } from "~/lib/core/success"; // Tree-shakable function import
import type { Result } from "~/types";

console.log("Basic Success Examples");
/**
 * Example 1: Basic usage with different data types
 *
 * This example shows how to create successful results with
 * different types of data using both import styles.
 */
export function basicSuccessExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 1", "Basic Success Cases");

  const stringResult = success("operation completed");
  console.log(stringResult);
  // Output: { status: "success", data: "operation completed" }

  const deepThoughtResult = success({
    question: "What is the meaning of life?",
    answer: 42,
  });
  console.log(deepThoughtResult);

  const numberResult = success(42);
  console.log(numberResult);
  // Output: { status: "success", data: 42 }

  const objectResult = success({ name: "John", id: 1 });
  console.log(objectResult);
  // Output: { status: "success", data: { name: "John", id: 1 } }

  const arrayResult = success([1, 2, 3]);
  console.log(arrayResult);
  // Output: { status: "success", data: [1, 2, 3] }

  // This indicates the operation succeeded (no errors occurred),
  // "no data but operation succeeded"
  // but the data is null (e.g., no results found)
  // This is useful for "found/not found" scenarios
  const nullResult = success(null);
  console.log(nullResult);
  // Output: { status: "success", data: null }
  return {
    stringResult,
    numberResult,
    objectResult,
    arrayResult,
    nullResult,
  };
}

/**
 * Example 2: Type safety with TypeScript generics
 *
 * This example demonstrates how both import styles maintain type safety
 * using TypeScript's generics.
 */
interface User {
  id: number;
  name: string;
  email: string;
}
export function typeSafetyExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Type Safety Example");
  // Create a success result with a specific interface using the object-based approach
  const userResult1: Result<User> = success({
    id: 1,
    name: "Alice",
    email: "alice@example.com",
  });

  // Create the same result using the tree-shakable function import
  const userResult2: Result<User> = success({
    id: 2,
    name: "Bob",
    email: "bob@example.com",
  });

  // TypeScript knows the exact shape of the data regardless of which import style used
  if (userResult1.status === "success") {
    // These properties are known to exist
    console.log(`User 1: ${userResult1.data.name}, Email: ${userResult1.data.email}`);

    // TypeScript would show errors for non-existent properties:
    // console.log(userResult1.data.age); // Error: Property 'age' does not exist on type 'User'
  }

  // The same type checking works for the function import version
  if (userResult2.status === "success") {
    console.log(`User 2: ${userResult2.data.name}, Email: ${userResult2.data.email}`);
  }

  return { userResult1, userResult2 };
}

/**
 * Example 3: Integration with validation functions
 *
 * This example shows how success can be used in a validation context
 * to create type-safe results. It demonstrates using the tree-shakable imports
 * in a real validation scenario.
 */
export async function validationExample() {
  // Import the error function directly to pair with success
  const error = await import("~/lib/core/error").then((module) => module.error);
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Validation Example");
  // A validation function that returns a Result<string, Error>
  function validateUsername(username: string): Result<string, Error> {
    if (!username) {
      return error(new Error("Username cannot be empty"));
    }

    if (username.length < 5) {
      return error(new Error("Username must be at least 5 characters"));
    }

    if (username.length > 20) {
      return error(new Error("Username cannot exceed 20 characters"));
    }

    // Username is valid, wrap it in a success result
    return success(username);
  }

  // Examples using the validation function
  const validResult = validateUsername("aFuzzyBear");
  const tooShortResult = validateUsername("Elmo");

  console.log(validResult);
  // Output: { status: "success", data: "johndoe" }

  console.log(tooShortResult);
  // Output: { status: "error", error: Error("Username must be at least 5 characters") }

  return { validResult, tooShortResult };
}

/**
 * Example 4: Using success with nullable values
 *
 * This demonstrates how to use success to wrap nullable values,
 * which is useful for "found/not found" scenarios. It shows the
 * difference in style between the two import approaches.
 */
export function nullableValueExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 4:", "Nullable Value Example");
  // Version 1: Using tree-shakable function import
  function findUserById(
    id: number,
    users: Array<{ id: number; name: string }>,
  ): Result<{ id: number; name: string } | null> {
    const user = users.find((u) => u.id === id);

    // We return a success even if user is null
    // This indicates the operation succeeded (no errors occurred),
    // but the user wasn't found
    return success(user || null);
  }

  // Version 2: Using object-based approach
  function findUserByName(
    name: string,
    users: Array<{ id: number; name: string }>,
  ): Result<{ id: number; name: string } | null> {
    const user = users.find((u) => u.name === name);

    // We return a success even if user is null
    return success(user || null);
  }

  const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];

  // Use the tree-shakable function version
  const foundUser = findUserById(1, users);
  const notFound = findUserById(3, users);

  // Use the object-based version
  const foundByName = findUserByName("Bob", users);

  console.log(foundUser);
  // Output: { status: "success", data: { id: 1, name: "Alice" } }

  console.log(notFound);
  // Output: { status: "success", data: null }

  console.log(foundByName);
  // Output: { status: "success", data: { id: 2, name: "Bob" } }

  return { foundUser, notFound, foundByName };
}

/**
 * Example 5: Caching Mechanism
 *
 * This caching mechanism example demonstrates a more complex use case but a common scenario
 *  with a slight difference by using the success function.
 * It shows how to cache results and return them immediately if available.
 * This is a common pattern in applications used to avoid redundant work within operations.
 * The example uses a simple in-memory cache to store results.
 * The cache is a Map where the key is a string identifier and the value is a Result.
 * The getCachedResource function checks if the resource is already in the cache.
 * * If it is, it returns the cached result immediately.
 * * If not, it fetches the resource and stores it in the cache.
 * * The mockFetchUser function simulates a network request with a random delay.
 * * The example demonstrates the caching mechanism by fetching the same resource twice.
 * * The first fetch will take longer, while the second fetch will return immediately from the cache.
 * * The timestamps of the fetched data are compared to verify that the second fetch is indeed from the cache.
 * * The example also shows how to handle errors in a real-world scenario.
 * * In a real-world application, you might want to use the `error` function to handle errors.
 *
 */
export async function cachingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 6: Caching Mechanism");

  // A simple caching function that returns a cached result or triggers a fetch
  const cache = new Map<string, Result<any>>();

  async function getCachedResource<T>(key: string, fetchFn: () => Promise<T>): Promise<Result<T>> {
    // Check if resource is in cache
    if (cache.has(key)) {
      console.log("Returning cached result immediately");
      const cachedResult = cache.get(key)!;

      // If the cached result is a promise, await it
      if (cachedResult.data instanceof Promise) {
        return {
          status: "success",
          data: await cachedResult.data,
        };
      }

      return cachedResult;
    }

    // If not in cache, fetch and wrap in success
    try {
      console.log("Fetching new resource");
      const fetchPromise = fetchFn();
      const result: Result<T> = { status: "success", data: fetchPromise };
      cache.set(key, result);

      // Resolve the promise
      const resolvedData = await fetchPromise;

      // Update cache with resolved data
      cache.set(key, { status: "success", data: resolvedData });

      return { status: "success", data: resolvedData };
    } catch (_err) {
      // In a real scenario, you might want to use the error function
      return { status: "success", data: null };
    }
  }

  const mockFetchUser = async (id: number) => {
    // Longer, variable delay to simulate real-world network conditions
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 250));
    return {
      id,
      name: `User ${id}`,
      timestamp: Date.now(),
    };
  };

  console.time("First Fetch");
  const firstFetch = await getCachedResource("user:1", () => mockFetchUser(1));
  console.timeEnd("First Fetch");

  console.time("Second Fetch");
  const secondFetch = await getCachedResource("user:1", () => mockFetchUser(1));
  console.timeEnd("Second Fetch");

  console.log("First fetch:", firstFetch);
  console.log("Second fetch (cached):", secondFetch);

  // Verify that the second fetch is truly from cache
  console.log(
    "Are timestamps identical?",
    (firstFetch.status === "success" && firstFetch.data.timestamp) ===
      (secondFetch.status === "success" && secondFetch.data.timestamp),
  );

  return { firstFetch, secondFetch };
}

// Run all examples
async function _runExamples() {
  basicSuccessExamples();
  typeSafetyExample();
  await validationExample();
  nullableValueExample();
  await cachingExample();
}
// await runExamples();
