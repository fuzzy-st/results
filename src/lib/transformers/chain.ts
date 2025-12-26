import type { Result } from "~/types";

/**
 * Chains operations that return Results (flatMap)
 *
 * @param result - The Result to transform
 * @param fn - Function that transforms a success value and may fail
 * @returns A new Result from the transformation or the original error
 *
 * @example
 * ```ts
 * const result = success(42);
 * const chained = chain(result, n => {
 *   if (n > 0) {
 *     return success(n * 2);
 *   } else {
 *     return error(new Error("Value must be positive"));
 *   }
 * });
 * // chained is { status: "success", data: 84 }
 * ```
 */
export function chain<T, U, E, F>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, F>,
): Result<U, E | F> {
  // Return the original error result directly
  if (result.status === "error") {
    return result;
  }
  // Apply the function to the success data
  return fn(result.data);
}
