import type { Result } from "~/types";

/**
 * Tap into an error Result for side effects without changing the Result
 * 
 * @param result - The Result to tap into
 * @param fn - Function to execute with the error value
 * @returns The original Result unchanged
 * 
 * @example
 * ```ts
 * const result = error(new Error("Not found"));
 * const tapped = tapError(result, err => {
 *   console.error(`Error occurred: ${err.message}`);
 * });
 * // tapped is still { status: "error", error: Error("Not found") }
 * ```
 */
export function tapError<T, E>(
    result: Result<T, E>,
    fn: (error: E) => void
): Result<T, E> {
    // Only execute function for error results
    if (result.status === "error") {
        fn(result.error);
    }
    // Return the original result unchanged
    return result;
}