import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

/**
 * Creates a boundary function for catching errors in a specific domain
 *
 * @param errorTransformer - Function to transform caught errors
 * @returns A boundary function that catches and transforms errors
 *
 * @example
 * ```ts
 * const apiBoundary = createErrorBoundary(err =>
 *   new ApiError("API operation failed", err)
 * );
 *
 * const result = apiBoundary(() => {
 *   // Code that might throw
 *   return fetchData();
 * });
 * ```
 */
export function createErrorBoundary<E>(errorTransformer: (error: unknown) => E) {
  return function boundary<T>(fn: () => T): Result<T, E> {
    try {
      return success(fn());
    } catch (caughtError) {
      return error(errorTransformer(caughtError));
    }
  };
}
