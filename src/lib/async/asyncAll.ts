import type { Result } from "~/types";

/**
 * Asynchronously combines multiple Results into a single Result with an array of values
 * If any Result is an error, the first error is returned
 *
 * @param results - Array of Promises that resolve to Results
 * @returns Promise that resolves to a Result containing either all success values or the first error
 *
 * @example
 * ```ts
 * const results = [
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3)
 * ];
 *
 * const combinedResult = await asyncAll(results);
 * // If all succeed: { status: "success", data: [user1, user2, user3] }
 * // If any fails: { status: "error", error: firstError }
 * ```
 */
export async function asyncAll<T, E>(results: Promise<Result<T, E>>[]): Promise<Result<T[], E>> {
  try {
    const resolvedResults = await Promise.all(results);

    // Pre-allocate the final array for better performance
    const values: T[] = new Array(resolvedResults.length);

    // Check all results in a single pass
    for (let i = 0; i < resolvedResults.length; i++) {
      const result = resolvedResults[i];
      if (result.status === "error") {
        return result;
      }
      values[i] = result.data;
    }

    return { status: "success", data: values };
  } catch (e) {
    // Handle any unexpected errors during Promise.all
    return {
      status: "error",
      error: e instanceof Error ? (e as unknown as E) : (new Error(String(e)) as unknown as E),
    };
  }
}
