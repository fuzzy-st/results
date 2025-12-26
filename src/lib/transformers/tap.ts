import type { Result } from "~/types";

/**
 * Tap into a Result for side effects without changing the Result
 *
 * @param result - The Result to tap into
 * @param fn - Function to execute with the Result
 * @returns The original Result unchanged
 *
 * @example
 * ```ts
 * const result = success(42);
 * const tapped = tap(result, r => {
 *   console.log(`Status: ${r.status}`);
 *   if (r.status === "success") {
 *     console.log(`Data: ${r.data}`);
 *   }
 * });
 * // tapped is still { status: "success", data: 42 }
 * ```
 */
export function tap<T, E>(result: Result<T, E>, fn: (result: Result<T, E>) => void): Result<T, E> {
  // Execute the side effect
  fn(result);
  // Return the original result unchanged
  return result;
}
