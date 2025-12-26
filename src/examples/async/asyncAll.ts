/**
 * Examples demonstrating the usage of the asyncAll method
 * from the Result pattern library.
 */

import { asyncAll } from "~/lib/async/asyncAll";
import { error } from "~/lib/core/error";
import { isError } from "~/lib/core/isError";
import { isSuccess } from "~/lib/core/isSuccess";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

/**
 * Example 1: Basic asyncAll Usage
 *
 * Demonstrates the basic usage of asyncAll for combining multiple async results
 */
export async function basicAsyncAllExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 1: Basic asyncAll Usage");

  // Simulate async operations that return Results
  async function fetchData(id: number): Promise<Result<{ id: number; data: string }, Error>> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (id <= 0) {
      return error(new Error(`Invalid ID: ${id}`));
    }

    return success({ id, data: `Data for ID ${id}` });
  }

  // Successful case: All operations succeed
  console.log("Successful case:");
  const successPromises = [fetchData(1), fetchData(2), fetchData(3)];

  const successResult = await asyncAll(successPromises);
  console.log("All operations successful:", isSuccess(successResult));
  console.log("Result:", successResult);

  // Error case: One operation fails
  console.log("\nError case:");
  const mixedPromises = [
    fetchData(1),
    fetchData(-1), // This will return an error
    fetchData(3),
  ];

  const mixedResult = await asyncAll(mixedPromises);
  console.log("All operations successful:", isSuccess(mixedResult));
  console.log("Result is error:", isError(mixedResult));
  if (isError(mixedResult)) {
    console.log("Error message:", mixedResult.error.message);
  }

  // Empty case: No operations
  console.log("\nEmpty case:");
  const emptyResult = await asyncAll([]);
  console.log("Result:", emptyResult);

  return { successResult, mixedResult, emptyResult };
}

/**
 * Example 2: Parallel Resource Fetching
 *
 * Shows how to use asyncAll for fetching multiple resources in parallel
 */
export async function parallelResourceFetchingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 2: Parallel Resource Fetching");

  // Simulate API for users, posts, and comments
  class Api {
    static async getUser(id: number): Promise<Result<User, Error>> {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (id === 999) {
        return error(new Error("User not found"));
      }
      return success({ id, name: `User ${id}`, email: `user${id}@example.com` });
    }

    static async getPosts(userId: number): Promise<Result<Post[], Error>> {
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (userId === 0) {
        return error(new Error("Invalid user ID"));
      }
      return success([
        { id: userId * 100 + 1, title: `Post 1 by User ${userId}`, content: "Content 1" },
        { id: userId * 100 + 2, title: `Post 2 by User ${userId}`, content: "Content 2" },
      ]);
    }

    static async getComments(postId: number): Promise<Result<Comment[], Error>> {
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (postId % 7 === 0) {
        return error(new Error("Comments temporarily unavailable"));
      }
      return success([
        { id: postId * 10 + 1, postId, text: `Comment 1 on post ${postId}` },
        { id: postId * 10 + 2, postId, text: `Comment 2 on post ${postId}` },
      ]);
    }
  }

  interface User {
    id: number;
    name: string;
    email: string;
  }

  interface Post {
    id: number;
    title: string;
    content: string;
  }

  interface Comment {
    id: number;
    postId: number;
    text: string;
  }

  // Fetch user profile with posts and latest comments
  async function fetchUserProfile(userId: number) {
    console.log(`Fetching profile for user ${userId}...`);

    // First, fetch the user
    const userResult = await Api.getUser(userId);

    if (isError(userResult)) {
      console.log(`Error fetching user: ${userResult.error.message}`);
      return userResult;
    }

    // Then fetch posts in parallel
    console.log(`Fetching posts for user ${userId}...`);
    const postsResult = await Api.getPosts(userId);

    if (isError(postsResult)) {
      console.log(`Error fetching posts: ${postsResult.error.message}`);
      return postsResult;
    }

    // Then fetch comments for all posts in parallel
    console.log(`Fetching comments for ${postsResult.data.length} posts...`);
    const commentPromises = postsResult.data.map((post) => Api.getComments(post.id));

    const commentsResults = await asyncAll(commentPromises);

    if (isError(commentsResults)) {
      console.log(`Error fetching comments: ${commentsResults.error.message}`);
      return commentsResults;
    }

    // Combine everything into a profile
    return success({
      user: userResult.data,
      posts: postsResult.data.map((post, index) => ({
        ...post,
        comments: commentsResults.data[index],
      })),
    });
  }

  // Test with valid user
  console.log("Fetching valid user profile:");
  const validProfile = await fetchUserProfile(1);
  console.log("Success:", isSuccess(validProfile));
  if (isSuccess(validProfile)) {
    console.log("User:", validProfile.data.user);
    console.log("Posts count:", validProfile.data.posts.length);
  }

  // Test with non-existent user
  console.log("\nFetching non-existent user profile:");
  const nonExistentProfile = await fetchUserProfile(999);
  console.log("Success:", isSuccess(nonExistentProfile));
  if (isError(nonExistentProfile)) {
    console.log("Error:", nonExistentProfile.error.message);
  }

  // Parallel fetching of multiple user profiles
  console.log("\nFetching multiple user profiles in parallel:");
  const userIds = [1, 2, 3];
  console.log(`Fetching profiles for users ${userIds.join(", ")}...`);

  const profilePromises = userIds.map((id) => fetchUserProfile(id));
  const profilesResult = await asyncAll(profilePromises);

  console.log("All profiles fetched successfully:", isSuccess(profilesResult));
  if (isSuccess(profilesResult)) {
    console.log("Number of profiles:", profilesResult.data.length);
  }

  return { validProfile, nonExistentProfile, profilesResult };
}

/**
 * Example 3: Batch Processing with Error Handling
 *
 * Demonstrates using asyncAll for batch processing with error handling
 */
export async function batchProcessingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 3: Batch Processing with Error Handling");

  // Simulate processing records from a database
  interface Record {
    id: number;
    data: string;
  }

  // Process a single record
  async function processRecord(record: Record): Promise<Result<string, Error>> {
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    // Simulate failure for specific IDs
    if (record.id % 5 === 0) {
      return error(new Error(`Processing failed for record ${record.id}`));
    }

    return success(`Processed: ${record.data.toUpperCase()}`);
  }

  // Process all records and collect successful results
  async function processBatch(records: Record[]): Promise<
    Result<
      {
        successful: string[];
        failed: Error[];
      },
      Error
    >
  > {
    console.log(`Processing batch of ${records.length} records...`);

    // Create promises for all records
    const processPromises = records.map((record) => processRecord(record));

    // Instead of using asyncAll directly, we'll process each result individually
    // This allows us to continue processing even if some records fail
    try {
      const results = await Promise.all(processPromises);

      // Separate successful and failed results
      const successful: string[] = [];
      const failed: Error[] = [];

      for (const result of results) {
        if (isSuccess(result)) {
          successful.push(result.data);
        } else {
          failed.push(result.error);
        }
      }

      return success({ successful, failed });
    } catch (err) {
      return error(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // Alternative implementation using asyncAll for critical processes where any error fails the batch
  async function processCriticalBatch(records: Record[]): Promise<Result<string[], Error>> {
    console.log(`Processing critical batch of ${records.length} records...`);

    // Create promises for all records
    const processPromises = records.map((record) => processRecord(record));

    // Use asyncAll to process all records - any error will fail the entire batch
    return await asyncAll(processPromises);
  }

  // Generate sample records
  const records = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    data: `record-${i + 1}`,
  }));

  // Process batch with partial failure handling
  console.log("Processing batch with partial failure handling:");
  const batchResult = await processBatch(records);

  if (isSuccess(batchResult)) {
    console.log(`Successfully processed ${batchResult.data.successful.length} records`);
    console.log(`Failed to process ${batchResult.data.failed.length} records`);
    console.log("Successful results:", batchResult.data.successful);
    console.log(
      "Errors:",
      batchResult.data.failed.map((e) => e.message),
    );
  } else {
    console.log("Batch processing failed:", batchResult.error.message);
  }

  // Process critical batch where any failure fails the entire batch
  console.log("\nProcessing critical batch (any failure fails all):");
  const criticalBatchResult = await processCriticalBatch(records);

  if (isSuccess(criticalBatchResult)) {
    console.log("All records processed successfully:", criticalBatchResult.data);
  } else {
    console.log("Critical batch processing failed:", criticalBatchResult.error.message);
  }

  // Process a batch with no failures
  const successRecords = records.filter((r) => r.id % 5 !== 0);
  console.log("\nProcessing batch with no failures:");
  const successBatchResult = await processCriticalBatch(successRecords);

  if (isSuccess(successBatchResult)) {
    console.log(`Successfully processed all ${successBatchResult.data.length} records`);
  }

  return { batchResult, criticalBatchResult, successBatchResult };
}

/**
 * Example 4: Resource Loading for Dashboard
 *
 * Shows a practical example of loading multiple resources for a dashboard
 */
export async function dashboardResourceLoadingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 4: Resource Loading for Dashboard");

  // Simulate different dashboard data sources
  async function fetchUserStats(): Promise<Result<{ users: number; activeToday: number }, Error>> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return success({ users: 1250, activeToday: 342 });
  }

  async function fetchRevenueData(): Promise<
    Result<
      {
        current: number;
        previous: number;
        trend: "up" | "down" | "stable";
      },
      Error
    >
  > {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return success({
      current: 15420,
      previous: 14310,
      trend: "up",
    });
  }

  async function fetchSystemStatus(): Promise<
    Result<
      {
        status: "online" | "degraded" | "offline";
        incidents: number;
      },
      Error
    >
  > {
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Simulate a system outage
    const simulateOutage = false;
    if (simulateOutage) {
      return error(new Error("Status monitoring system offline"));
    }

    return success({
      status: "online",
      incidents: 0,
    });
  }

  async function fetchLatestAlerts() {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return success([
      "New user signup rate increased by 20%",
      "Server capacity at 70%",
      "New feature deployment scheduled for tomorrow",
    ]);
  }

  // Load all dashboard components in parallel
  async function loadDashboard() {
    console.log("Loading dashboard components...");
    console.time("Dashboard load time");

    const dashboardResult = await asyncAll([
      fetchUserStats(),
      fetchRevenueData(),
      fetchSystemStatus(),
      fetchLatestAlerts(),
    ]);

    console.timeEnd("Dashboard load time");

    if (isError(dashboardResult)) {
      console.log("Dashboard loading failed:", dashboardResult.error.message);
      return dashboardResult;
    }

    // Structure the dashboard data
    return success({
      userStats: dashboardResult.data[0],
      revenue: dashboardResult.data[1],
      systemStatus: dashboardResult.data[2],
      alerts: dashboardResult.data[3],
    });
  }

  // Load the dashboard
  const dashboardResult = await loadDashboard();

  if (isSuccess(dashboardResult)) {
    console.log("Dashboard loaded successfully!");
    console.log("User stats:", dashboardResult.data.userStats);
    console.log("Revenue:", dashboardResult.data.revenue);
    console.log("System status:", dashboardResult.data.systemStatus);
    console.log("Alerts:", dashboardResult.data.alerts);
  } else {
    console.log("Failed to load dashboard:", dashboardResult.error.message);
  }

  return { dashboardResult };
}

// Run all examples
async function _runAsyncAllExamples() {
  await basicAsyncAllExamples();
  await parallelResourceFetchingExample();
  await batchProcessingExample();
  await dashboardResourceLoadingExample();
}

// Uncomment to run
// runAsyncAllExamples();
