import type { Result } from "~/types";

/**
 * Executes a finally block regardless of result status after an async operation
 *
 * @param resultPromise - Promise that resolves to a Result
 * @param finalFn - Function to execute after the Result is resolved
 * @returns Promise resolving to the original Result
 *
 * @example
 * ```ts
 * const result = await withFinally(
 *   fetchData(),
 *   () => {
 *     console.log("Operation completed");
 *     closeConnection();
 *   }
 * );
 * ```
 */
export async function withFinally<T, E>(
  resultPromise: Promise<Result<T, E>>,
  finalFn: () => void | Promise<void>,
): Promise<Result<T, E>> {
  try {
    const result = await resultPromise;
    return result;
  } finally {
    await finalFn();
  }
}
