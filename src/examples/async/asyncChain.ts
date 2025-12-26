/**
 * Examples demonstrating the usage of the asyncChain method
 * from the Result pattern library.
 */

import { asyncChain } from "~/lib/async/asyncChain";
import { error } from "~/lib/core/error";
import { isError } from "~/lib/core/isError";
import { isSuccess } from "~/lib/core/isSuccess";
import { success } from "~/lib/core/success";

/**
 * Example 1: Basic Async Chaining
 *
 * Demonstrates how to chain async operations that might fail
 */
export async function basicAsyncChainExample() {
  console.log(Array.from({ length: 20 }, () => "-").join(""));
  console.log("Example 1: Basic Async Chaining");

  // Create a success result
  const numberResult = success(5);

  // Define an async operation that might fail
  const validateAndDouble = async (x: number): Promise<Result<number, Error>> => {
    // Simulate async validation
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (x <= 0) {
      return error(new Error("Value must be positive"));
    }

    return success(x * 2);
  };

  // Chain the operation with our Result
  console.log("Starting with:", numberResult);
  console.log("Applying validateAndDouble...");

  const doubledResult = await asyncChain(numberResult, validateAndDouble);
  console.log("Result:", doubledResult);

  // Try with a value that will fail validation
  const negativeResult = success(-5);
  console.log("\nStarting with negative value:", negativeResult);
  console.log("Applying validateAndDouble...");

  const failedResult = await asyncChain(negativeResult, validateAndDouble);
  console.log("Result:", failedResult);

  // Try with an error result to demonstrate short-circuiting
  const errorResult = error(new Error("Original error"));
  console.log("\nStarting with an error:", errorResult);
  console.log("Applying validateAndDouble...");

  const unchangedError = await asyncChain(errorResult, validateAndDouble);
  console.log("Result:", unchangedError);
  console.log("Notice the original error is preserved, and validateAndDouble was not called.");

  return { numberResult, doubledResult, negativeResult, failedResult, errorResult, unchangedError };
}

/**
 * Example 2: Data Validation Pipeline
 *
 * Shows how to create a multi-step validation pipeline with asyncChain
 */
interface UserInput {
  username: string;
  email: string;
  age: number;
}

interface ValidatedUser extends UserInput {
  id: string;
  validated: boolean;
}

export async function validationPipelineExample() {
  console.log(Array.from({ length: 20 }, () => "-").join(""));
  console.log("Example 2: Data Validation Pipeline");

  // Input data
  const userInput: UserInput = {
    username: "johndoe",
    email: "john@example.com",
    age: 25,
  };

  // Input with validation issues
  const invalidInput: UserInput = {
    username: "a", // too short
    email: "not-an-email", // invalid format
    age: 15, // too young
  };

  // Step 1: Validate username
  async function validateUsername(data: UserInput): Promise<Result<UserInput, Error>> {
    console.log("Validating username...");
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay

    if (!data.username || data.username.length < 3) {
      return error(new Error("Username must be at least 3 characters"));
    }

    return success(data);
  }

  // Step 2: Validate email
  async function validateEmail(data: UserInput): Promise<Result<UserInput, Error>> {
    console.log("Validating email...");
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      return error(new Error("Invalid email format"));
    }

    return success(data);
  }

  // Step 3: Validate age
  async function validateAge(data: UserInput): Promise<Result<UserInput, Error>> {
    console.log("Validating age...");
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay

    if (data.age < 18) {
      return error(new Error("You must be at least 18 years old"));
    }

    return success(data);
  }

  // Step 4: Create validated user
  async function createUser(data: UserInput): Promise<Result<ValidatedUser, Error>> {
    console.log("Creating user...");
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay

    // Generate an ID and convert to validated user
    const id = `user-${Date.now().toString(36)}`;

    return success({
      ...data,
      id,
      validated: true,
    });
  }

  // Create a validation pipeline for valid input
  console.log("Validating valid user input...");

  // Step 1: Start with input data as a success Result
  const inputResult = success(userInput);

  // Step 2: Apply validation pipeline
  const validationResult = await asyncChain(inputResult, validateUsername)
    .then((result) => asyncChain(result, validateEmail))
    .then((result) => asyncChain(result, validateAge))
    .then((result) => asyncChain(result, createUser));

  console.log("\nValidation result:", validationResult);

  if (isSuccess(validationResult)) {
    console.log("User created successfully!");
    console.log("Validated user:", validationResult.data);
  } else {
    console.error("Validation failed:", validationResult.error.message);
  }

  // Now try with invalid input
  console.log("\nValidating invalid user input...");

  const invalidInputResult = success(invalidInput);

  const invalidValidationResult = await asyncChain(invalidInputResult, validateUsername)
    .then((result) => asyncChain(result, validateEmail))
    .then((result) => asyncChain(result, validateAge))
    .then((result) => asyncChain(result, createUser));

  console.log("\nInvalid validation result:", invalidValidationResult);

  if (isSuccess(invalidValidationResult)) {
    console.log("User created successfully!");
    console.log("Validated user:", invalidValidationResult.data);
  } else {
    console.error("Validation failed:", invalidValidationResult.error.message);
    console.log("Notice how the pipeline stopped at the first failure (username validation)");
  }

  return { validationResult, invalidValidationResult };
}

/**
 * Example 3: API Data Fetching Chain
 *
 * Shows how to use asyncChain for a sequence of API requests
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

interface Comment {
  id: number;
  postId: number;
  email: string;
  body: string;
}

export async function apiDataFetchingExample() {
  console.log(Array.from({ length: 20 }, () => "-").join(""));
  console.log("Example 3: API Data Fetching Chain");

  // Simulated database
  const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];

  const posts = [
    { id: 101, userId: 1, title: "Alice's first post", body: "Hello world!" },
    { id: 102, userId: 1, title: "Alice's second post", body: "Still here!" },
    { id: 201, userId: 2, title: "Bob's post", body: "Hi everyone!" },
  ];

  const comments = [
    { id: 1001, postId: 101, email: "commenter1@example.com", body: "Great post!" },
    { id: 1002, postId: 101, email: "commenter2@example.com", body: "I agree!" },
    { id: 1003, postId: 102, email: "commenter1@example.com", body: "Nice follow-up" },
    { id: 2001, postId: 201, email: "commenter3@example.com", body: "Welcome Bob!" },
  ];

  // Async functions to fetch data
  async function fetchUser(userId: number): Promise<Result<User, Error>> {
    console.log(`Fetching user with ID ${userId}...`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

    const user = users.find((u) => u.id === userId);
    if (!user) {
      return error(new Error(`User with ID ${userId} not found`));
    }

    return success(user);
  }

  async function fetchUserPosts(user: User): Promise<Result<Post[], Error>> {
    console.log(`Fetching posts for user ${user.name}...`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

    const userPosts = posts.filter((p) => p.userId === user.id);
    return success(userPosts);
  }

  async function fetchPostComments(post: Post): Promise<Result<Comment[], Error>> {
    console.log(`Fetching comments for post "${post.title}"...`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

    const postComments = comments.filter((c) => c.postId === post.id);
    return success(postComments);
  }

  // Chain operations to get a user's first post and its comments
  console.log("Fetching data for user with ID 1...");

  // Step 1: Fetch the user
  const userResult = await fetchUser(1);

  // Step 2: Fetch the user's posts
  const postsResult = await asyncChain(userResult, fetchUserPosts);

  // Step 3: Extract the first post
  const firstPostResult = await asyncChain(postsResult, (posts) => {
    const firstPost = posts[0];
    if (!firstPost) {
      return error(new Error("User has no posts"));
    }
    return success(firstPost);
  });

  // Step 4: Fetch comments for the first post
  const commentsResult = await asyncChain(firstPostResult, fetchPostComments);

  // Handle the final result
  if (isSuccess(commentsResult)) {
    console.log("\nFetched comments successfully!");
    console.log(
      `Found ${commentsResult.data.length} comments for post "${firstPostResult.status === "success" ? firstPostResult.data.title : "unknown"}":`,
    );
    commentsResult.data.forEach((comment, index) => {
      console.log(`${index + 1}. ${comment.email}: "${comment.body}"`);
    });
  } else {
    console.error("Failed to fetch comments:", commentsResult.error.message);
  }

  // Try with a non-existent user to see error handling
  console.log("\nFetching data for non-existent user (ID 999)...");

  const nonExistentUserResult = await fetchUser(999);
  const nonExistentUserPostsResult = await asyncChain(nonExistentUserResult, fetchUserPosts);

  console.log("Non-existent user posts result:", nonExistentUserPostsResult);
  console.log(
    "Notice how the error from fetchUser is preserved and fetchUserPosts was not called.",
  );

  return {
    userResult,
    postsResult,
    firstPostResult,
    commentsResult,
    nonExistentUserResult,
    nonExistentUserPostsResult,
  };
}

/**
 * Example 4: Error Recovery with Fallbacks
 *
 * Shows how to implement fallback strategies in async operations
 */
export async function errorRecoveryExample() {
  console.log(Array.from({ length: 20 }, () => "-").join(""));
  console.log("Example 4: Error Recovery with Fallbacks");

  // Simulated data sources
  const primaryDatabase = {
    async getData(id: string): Promise<Result<any, Error>> {
      console.log(`Attempting to fetch data with ID ${id} from primary database...`);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

      // Simulate failures for specific IDs
      if (id === "fail") {
        return error(new Error("Primary database connection error"));
      }

      if (id === "missing") {
        return error(new Error("Data not found in primary database"));
      }

      return success({
        id,
        source: "primary",
        value: `Primary data for ${id}`,
        timestamp: new Date().toISOString(),
      });
    },
  };

  const backupDatabase = {
    async getData(id: string): Promise<Result<any, Error>> {
      console.log(`Attempting to fetch data with ID ${id} from backup database...`);
      await new Promise((resolve) => setTimeout(resolve, 150)); // Simulate network delay

      // Backup also fails for some IDs
      if (id === "fail") {
        return error(new Error("Backup database also unavailable"));
      }

      return success({
        id,
        source: "backup",
        value: `Backup data for ${id}`,
        timestamp: new Date().toISOString(),
      });
    },
  };

  const cache = {
    data: new Map<string, any>(),

    async getData(id: string): Promise<Result<any, Error>> {
      console.log(`Checking cache for data with ID ${id}...`);
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate cache lookup

      const cachedData = this.data.get(id);
      if (!cachedData) {
        return error(new Error("Cache miss"));
      }

      return success({
        ...cachedData,
        source: "cache",
        cached: true,
      });
    },

    set(id: string, data: any): void {
      this.data.set(id, data);
      console.log(`Saved data with ID ${id} to cache`);
    },
  };

  // Function to fetch data with fallbacks
  async function fetchWithFallbacks(id: string): Promise<Result<any, Error>> {
    console.log(`Fetching data with ID ${id} using fallback strategy...`);

    // Try cache first
    const cacheResult = await cache.getData(id);

    if (isSuccess(cacheResult)) {
      console.log("Cache hit! Returning cached data.");
      return cacheResult;
    }

    console.log("Cache miss. Trying primary database...");

    // Try primary database
    const primaryResult = await primaryDatabase.getData(id);

    if (isSuccess(primaryResult)) {
      console.log("Primary database success! Caching result...");
      cache.set(id, primaryResult.data);
      return primaryResult;
    }

    console.log(`Primary database error: ${primaryResult.error.message}`);
    console.log("Trying backup database...");

    // Try backup database as fallback
    const backupResult = await backupDatabase.getData(id);

    if (isSuccess(backupResult)) {
      console.log("Backup database success! Caching result...");
      cache.set(id, backupResult.data);
      return backupResult;
    }

    console.log(`Backup database error: ${backupResult.error.message}`);

    // All attempts failed
    return error(
      new Error(
        `All data sources failed. Primary: ${primaryResult.error.message}, Backup: ${backupResult.error.message}`,
      ),
    );
  }

  // Implement the same fallback logic using asyncChain
  async function fetchWithAsyncChain(id: string): Promise<Result<any, Error>> {
    console.log(`\nFetching data with ID ${id} using asyncChain...`);

    // Start with cache
    const cacheResult = await cache.getData(id);

    // If cache fails, try primary database
    const primaryFallback = await asyncChain(cacheResult, async () => {
      console.log("Cache miss. Trying primary database via asyncChain...");
      const primaryResult = await primaryDatabase.getData(id);

      if (isSuccess(primaryResult)) {
        cache.set(id, primaryResult.data);
      }

      return primaryResult;
    });

    // If primary fails, try backup
    const backupFallback = await asyncChain(primaryFallback, async () => {
      console.log("Primary database failed. Trying backup via asyncChain...");
      const backupResult = await backupDatabase.getData(id);

      if (isSuccess(backupResult)) {
        cache.set(id, backupResult.data);
      }

      return backupResult;
    });

    // Check the final result
    if (isError(backupFallback)) {
      console.log("All sources failed in asyncChain approach.");
    } else {
      console.log("Success with asyncChain approach!");
    }

    return backupFallback;
  }

  // Test with data that will be found in primary database
  console.log("\n--- Scenario 1: Data exists in primary database ---");

  const successResult = await fetchWithFallbacks("success");
  console.log("Result:", successResult);

  // Test with data that will only be found in backup
  console.log("\n--- Scenario 2: Data exists only in backup database ---");

  const missingResult = await fetchWithFallbacks("missing");
  console.log("Result:", missingResult);

  // Test with data that will fail everywhere
  console.log("\n--- Scenario 3: Data unavailable everywhere ---");

  const failResult = await fetchWithFallbacks("fail");
  console.log("Result:", failResult);

  // Test with cached data
  console.log("\n--- Scenario 4: Previously cached data ---");

  const cachedResult = await fetchWithFallbacks("success");
  console.log("Result:", cachedResult);

  // Test the asyncChain implementation
  console.log("\n--- Scenario 5: Using asyncChain for fallbacks ---");

  const chainResult = await fetchWithAsyncChain("new-data");
  console.log("AsyncChain result:", chainResult);

  return {
    successResult,
    missingResult,
    failResult,
    cachedResult,
    chainResult,
  };
}

// Run all examples
async function _runAsyncChainExamples() {
  await basicAsyncChainExample();
  await validationPipelineExample();
  await apiDataFetchingExample();
  await errorRecoveryExample();
}

// Uncomment to run the examples
// await runAsyncChainExamples();
