/**
 * Examples demonstrating the usage of the asyncPipe method
 * from the Result pattern library.
 */

import { asyncPipe } from "~/lib/async/asyncPipe";
import { error } from "~/lib/core/error";
import { isSuccess } from "~/lib/core/isSuccess";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

/**
 * Example 1: Basic Pipeline Usage
 *
 * Demonstrates how to create a simple async processing pipeline
 */
export async function basicPipelineExample() {
  console.log(Array.from({ length: 20 }, () => "-").join(""));
  console.log("Example 1: Basic Pipeline Usage");

  // Define some async transformation functions
  const fetchData = async (id: string) => {
    console.log(`Fetching data for ID: ${id}...`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate API delay

    return {
      id,
      name: `Item ${id}`,
      timestamp: new Date().toISOString(),
    };
  };

  const enrichData = async (data: any) => {
    console.log(`Enriching data for ${data.name}...`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate processing delay

    return {
      ...data,
      category: "example",
      processed: true,
    };
  };

  const formatOutput = async (data: any) => {
    console.log("Formatting output...");
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate processing delay

    return {
      item: data,
      meta: {
        processedAt: new Date().toISOString(),
        version: "1.0",
      },
    };
  };

  // Create and execute a pipeline
  console.log("Starting pipeline with a simple string ID...");

  const result = await asyncPipe(
    "123", // Initial value - a string ID
    fetchData, // Step 1: Fetch the data
    enrichData, // Step 2: Enrich the data
    formatOutput, // Step 3: Format for output
  );

  // Handle the result
  if (isSuccess(result)) {
    console.log("\nPipeline completed successfully!");
    console.log("Final result:", result.data);
  } else {
    console.error("Pipeline failed:", result);
  }

  // Create another pipeline that starts with a Result
  console.log("\nStarting pipeline with an initial Result...");

  const initialResult = success("456");

  const result2 = await asyncPipe(initialResult, fetchData, enrichData, formatOutput);

  if (isSuccess(result2)) {
    console.log("\nSecond pipeline completed successfully!");
    console.log("Final result:", result2.data);
  } else {
    console.error("Second pipeline failed:", result2.error.message);
  }

  return { result, result2 };
}

/**
 * Example 2: Data Validation Pipeline
 *
 * Shows how to use asyncPipe for multi-step validation
 */
interface UserInput {
  username: string;
  email: string;
  password: string;
  age: number;
}

interface ValidatedUser extends UserInput {
  id: string;
  created: string;
}

export async function validationPipelineExample() {
  console.log(Array.from({ length: 20 }, () => "-").join(""));
  console.log("Example 2: Data Validation Pipeline");

  // Sample input data
  const validUserInput: UserInput = {
    username: "johndoe",
    email: "john@example.com",
    password: "P@ssw0rd!",
    age: 30,
  };

  // Input with validation issues
  const invalidUserInput: UserInput = {
    username: "j", // Too short
    email: "not-an-email", // Invalid format
    password: "pass", // Too weak
    age: 15, // Too young
  };

  // Define validation functions
  const validateUsername = async (data: UserInput) => {
    console.log("Validating username...");

    if (!data.username || data.username.length < 3) {
      return error(new Error("Username must be at least 3 characters"));
    }

    return data;
  };

  const validateEmail = async (data: UserInput) => {
    console.log("Validating email...");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      return error(new Error("Invalid email format"));
    }

    return data;
  };

  const validatePassword = async (data: UserInput) => {
    console.log("Validating password...");

    if (!data.password || data.password.length < 8) {
      return error(new Error("Password must be at least 8 characters"));
    }

    return data;
  };

  const validateAge = async (data: UserInput) => {
    console.log("Validating age...");

    if (!data.age || data.age < 18) {
      return error(new Error("You must be at least 18 years old"));
    }

    return data;
  };

  const createUser = async (data: UserInput): Promise<Result<ValidatedUser, Error>> => {
    console.log("Creating user...");

    // Simulate async database operation
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Create final user object
    const user: ValidatedUser = {
      ...data,
      id: `user-${Date.now().toString(36)}`,
      created: new Date().toISOString(),
    };

    return success(user);
  };

  // Create and execute a pipeline with valid data
  console.log("\nValidating and creating user with valid data...");

  const validResult = await asyncPipe(
    validUserInput,
    validateUsername,
    validateEmail,
    validatePassword,
    validateAge,
    createUser,
  );

  if (isSuccess(validResult)) {
    console.log("\nUser created successfully!");
    console.log("User:", validResult.data);
  } else {
    console.error("Failed to create user:", validResult.error.message);
  }

  // Try with invalid data
  console.log("\nValidating and creating user with invalid data...");

  const invalidResult = await asyncPipe(
    invalidUserInput,
    validateUsername,
    validateEmail,
    validatePassword,
    validateAge,
    createUser,
  );

  if (isSuccess(invalidResult)) {
    console.log("\nUser created successfully!");
    console.log("User:", invalidResult.data);
  } else {
    console.error("Failed to create user:", invalidResult.error.message);
    console.log("Notice how the pipeline stopped at the first validation error");
  }

  return { validResult, invalidResult };
}

/**
 * Example 3: API Request Pipeline
 *
 * Shows how to use asyncPipe to create a pipeline of API requests
 */
interface User {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface Comment {
  id: number;
  postId: number;
  email: string;
  body: string;
}

interface EnrichedPost extends Post {
  author: User;
  comments: Comment[];
}

export async function apiRequestPipelineExample() {
  console.log(Array.from({ length: 20 }, () => "-").join(""));
  console.log("Example 3: API Request Pipeline");

  // Mock API data
  const users: User[] = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];

  const posts: Post[] = [
    { id: 101, title: "Alice's Post", body: "Hello world!", userId: 1 },
    { id: 102, title: "Alice's Second Post", body: "Still here!", userId: 1 },
    { id: 201, title: "Bob's Post", body: "Hi everyone!", userId: 2 },
  ];

  const comments: Comment[] = [
    { id: 1001, postId: 101, email: "commenter1@example.com", body: "Great post!" },
    { id: 1002, postId: 101, email: "commenter2@example.com", body: "I agree!" },
    { id: 1003, postId: 102, email: "commenter3@example.com", body: "Nice follow-up" },
    { id: 2001, postId: 201, email: "commenter4@example.com", body: "Welcome, Bob!" },
  ];

  // API functions
  const fetchPost = async (postId: number): Promise<Result<Post, Error>> => {
    console.log(`Fetching post with ID ${postId}...`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const post = posts.find((p) => p.id === postId);
    if (!post) {
      return error(new Error(`Post with ID ${postId} not found`));
    }

    return success(post);
  };

  const fetchAuthor = async (post: Post): Promise<Result<EnrichedPost, Error>> => {
    console.log(`Fetching author for post "${post.title}"...`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    const author = users.find((u) => u.id === post.userId);
    if (!author) {
      return error(new Error(`Author with ID ${post.userId} not found`));
    }

    // Create enriched post with author
    const enriched: EnrichedPost = {
      ...post,
      author,
      comments: [], // Will be populated in the next step
    };

    return success(enriched);
  };

  const fetchComments = async (post: EnrichedPost): Promise<Result<EnrichedPost, Error>> => {
    console.log(`Fetching comments for post "${post.title}"...`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Find comments for this post
    const postComments = comments.filter((c) => c.postId === post.id);

    // Return enriched post with comments
    return success({
      ...post,
      comments: postComments,
    });
  };

  const formatPostData = async (post: EnrichedPost): Promise<Result<any, Error>> => {
    console.log("Formatting post data...");

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return success({
      title: post.title,
      content: post.body,
      author: post.author.name,
      commentCount: post.comments.length,
      comments: post.comments.map((c) => ({
        email: c.email,
        comment: c.body,
      })),
    });
  };

  // Create and execute a pipeline to get a post with all details
  console.log("\nFetching and processing post data...");

  const result = await asyncPipe(
    101, // Post ID
    fetchPost,
    fetchAuthor,
    fetchComments,
    formatPostData,
  );

  if (isSuccess(result)) {
    console.log("\nPost data fetched and processed successfully!");
    console.log("Formatted post data:", result.data);
  } else {
    console.error("Failed to fetch post data:", result.error.message);
  }

  // Try with a non-existent post
  console.log("\nFetching non-existent post...");

  const notFoundResult = await asyncPipe(
    999, // Non-existent post ID
    fetchPost,
    fetchAuthor,
    fetchComments,
    formatPostData,
  );

  if (isSuccess(notFoundResult)) {
    console.log("\nPost data fetched and processed successfully!");
    console.log("Formatted post data:", notFoundResult.data);
  } else {
    console.error("Failed to fetch post data:", notFoundResult.error.message);
  }

  return { result, notFoundResult };
}

/**
 * Example 4: Error Handling and Recovery
 *
 * Shows how to handle errors and provide fallbacks in a pipeline
 */
export async function errorHandlingExample() {
  console.log(Array.from({ length: 20 }, () => "-").join(""));
  console.log("Example 4: Error Handling and Recovery");

  // Simulated data sources
  const primarySource = {
    async getData(id: string): Promise<Result<any, Error>> {
      console.log(`Trying to fetch ${id} from primary source...`);

      // Simulate some data sources failing
      if (id === "always-fail" || id === "primary-fail") {
        await new Promise((resolve) => setTimeout(resolve, 150));
        return error(new Error("Primary source unavailable"));
      }

      await new Promise((resolve) => setTimeout(resolve, 150));
      return success({
        id,
        source: "primary",
        quality: "high",
        timestamp: new Date().toISOString(),
        data: { value: Math.floor(Math.random() * 1000) },
      });
    },
  };

  const secondarySource = {
    async getData(id: string): Promise<Result<any, Error>> {
      console.log(`Trying to fetch ${id} from secondary source...`);

      // This source also fails sometimes
      if (id === "always-fail") {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return error(new Error("Secondary source also unavailable"));
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
      return success({
        id,
        source: "secondary",
        quality: "medium",
        timestamp: new Date().toISOString(),
        data: { value: Math.floor(Math.random() * 500) },
      });
    },
  };

  const tertiarySource = {
    async getData(id: string): Promise<Result<any, Error>> {
      console.log(`Trying to fetch ${id} from tertiary source...`);

      // This is our last resort, should always work
      await new Promise((resolve) => setTimeout(resolve, 100));
      return success({
        id,
        source: "tertiary",
        quality: "low",
        timestamp: new Date().toISOString(),
        data: { value: Math.floor(Math.random() * 100) },
      });
    },
  };

  // Create a multi-source data fetcher with fallbacks
  const fetchWithFallbacks = async (id: string) => {
    // Try primary source first
    const primaryResult = await primarySource.getData(id);

    if (isSuccess(primaryResult)) {
      console.log("Primary source succeeded!");
      return primaryResult;
    }

    console.log(`Primary source failed: ${primaryResult.error.message}`);
    console.log("Trying secondary source...");

    // Try secondary source as first fallback
    const secondaryResult = await secondarySource.getData(id);

    if (isSuccess(secondaryResult)) {
      console.log("Secondary source succeeded!");
      return secondaryResult;
    }

    console.log(`Secondary source failed: ${secondaryResult.error.message}`);
    console.log("Trying tertiary source as last resort...");

    // Try tertiary source as last resort
    const tertiaryResult = await tertiarySource.getData(id);

    if (isSuccess(tertiaryResult)) {
      console.log("Tertiary source succeeded!");
      return tertiaryResult;
    }

    // All sources failed
    console.log(`All sources failed for ID ${id}`);
    return error(new Error(`Failed to fetch data for ${id} from all sources`));
  };

  // Use the multi-source fetcher in a pipeline
  const processWithFallbacks = async (id: string) => {
    return await asyncPipe(
      id,
      fetchWithFallbacks,
      async (data) => {
        console.log(`Processing data from ${data.source} source...`);
        await new Promise((resolve) => setTimeout(resolve, 100));

        return {
          ...data,
          processed: true,
          qualityScore: data.source === "primary" ? 1.0 : data.source === "secondary" ? 0.7 : 0.4,
        };
      },
      async (data) => {
        console.log("Finalizing data...");
        await new Promise((resolve) => setTimeout(resolve, 100));

        return {
          id: data.id,
          value: data.data.value,
          quality: data.quality,
          score: data.qualityScore,
          source: data.source,
          processed: data.processed,
          processedAt: new Date().toISOString(),
        };
      },
    );
  };

  // Test with a normal ID (primary source succeeds)
  console.log("\n--- Scenario 1: Using primary source ---");

  const normalResult = await processWithFallbacks("normal");

  if (isSuccess(normalResult)) {
    console.log("\nProcessing completed successfully!");
    console.log("Result:", normalResult.data);
  } else {
    console.error("Processing failed:", normalResult.error.message);
  }

  // Test with a primary-fail ID (secondary source used)
  console.log("\n--- Scenario 2: Primary fails, using secondary source ---");

  const primaryFailResult = await processWithFallbacks("primary-fail");

  if (isSuccess(primaryFailResult)) {
    console.log("\nProcessing completed successfully with fallback!");
    console.log("Result:", primaryFailResult.data);
  } else {
    console.error("Processing failed:", primaryFailResult.error.message);
  }

  // Test with an always-fail ID (tertiary source used)
  console.log("\n--- Scenario 3: Primary and secondary fail, using tertiary source ---");

  const alwaysFailResult = await processWithFallbacks("always-fail");

  if (isSuccess(alwaysFailResult)) {
    console.log("\nProcessing completed successfully with final fallback!");
    console.log("Result:", alwaysFailResult.data);
  } else {
    console.error("Processing failed:", alwaysFailResult.error.message);
  }

  return {
    normalResult,
    primaryFailResult,
    alwaysFailResult,
  };
}

// Run all examples
async function runAsyncPipeExamples() {
  await basicPipelineExample();
  await validationPipelineExample();
  await apiRequestPipelineExample();
  await errorHandlingExample();
}

// Uncomment to run the examples
await runAsyncPipeExamples();
