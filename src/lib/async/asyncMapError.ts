import type { Result } from "~/types";
import { error } from "~/lib/core/error";

/**
 * Maps a Result error value asynchronously
 * 
 * Like `mapError()` but for async transformations, allowing you to transform
 * the error in an error Result using an async function
 * 
 * @param result - The Result to transform
 * @param fn - Async transformation function for the error value
 * @returns A Promise resolving to a new Result with the original success data or transformed error
 * 
 * @example
 * ```ts
 * const errorResult = error(new Error("Network failure"));
 * 
 * // Transform error into a user-friendly message asynchronously
 * const userFriendlyError = await asyncMapError(errorResult, async err => {
 *   const message = await translateErrorMessage(err.message);
 *   return new DisplayError(message);
 * });
 * ```
 */
export async function asyncMapError<T, E, F>(
    result: Result<T, E>,
    fn: (error: E) => Promise<F>
): Promise<Result<T, F>> {
    // Short-circuit for success results
    if (result.status === "success") {
        return result;
    }

    try {
        // Apply the async transformation to error
        const mappedError = await fn(result.error);
        return error(mappedError);
    } catch (e) {
        // If the transformation itself throws, return that as the new error
        return error(e instanceof Error
            ? (e as unknown as F)
            : (new Error(String(e)) as unknown as F)
        );
    }
}