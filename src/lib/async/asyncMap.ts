import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";
import { isError } from "../core/isError";

/**
 * Maps a Result value asynchronously
 *
 * Like `map()` but for async transformations, allowing you to transform
 * the data in a successful Result using an async function
 *
 * @param result - The Result to transform
 * @param fn - Async transformation function for the success value
 * @returns A Promise resolving to a new Result with transformed data or the original error
 *
 * @example
 * ```ts
 * const userResult = success({ id: 1, name: "John" });
 *
 * // Transform a user into their posts asynchronously
 * const postsResult = await asyncMap(userResult, async user => {
 *   const response = await fetch(`/api/users/${user.id}/posts`);
 *   return response.json();
 * });
 * ```
 */
export async function asyncMap<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Promise<U>,
): Promise<Result<U, E>> {
  // Short-circuit for error results
  if (isError(result)) {
    // If the result is an error, return it as is
    // No need to apply the async function
    return result;
  }

  try {
    // Apply the async transformation to success data
    const mappedData = await fn(result.data);
    return success(mappedData);
  } catch (e) {
    // Convert any function exceptions to error Results
    // Use type assertion to match the original error type
    return error(e instanceof Error ? (e as unknown as E) : (new Error(String(e)) as unknown as E));
  }
}
