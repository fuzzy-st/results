import type { Result } from "~/types";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";

/**
 * Creates an async boundary function for catching errors in a specific domain
 * 
 * @param errorTransformer - Function to transform caught errors
 * @returns An async boundary function that catches and transforms errors
 * 
 * @example
 * ```ts
 * const asyncApiBoundary = createAsyncErrorBoundary(err => 
 *   new ApiError(500, "API operation failed", err)
 * );
 * 
 * const result = await asyncApiBoundary(async () => {
 *   const response = await fetch('/api/data');
 *   if (!response.ok) throw new Error(`HTTP error ${response.status}`);
 *   return await response.json();
 * });
 * ```
 */
export function createAsyncErrorBoundary<E>(errorTransformer: (error: unknown) => E) {
    return async function asyncBoundary<T>(
        fn: () => Promise<T>
    ): Promise<Result<T, E>> {
        try {
            const result = await fn();
            return success(result);
        } catch (caughtError) {
            return error(errorTransformer(caughtError));
        }
    };
}