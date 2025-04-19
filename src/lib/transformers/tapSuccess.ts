import type { Result } from "~/types";

/**
 * Tap into a successful Result for side effects without changing the Result
 * 
 * @param result - The Result to tap into
 * @param fn - Function to execute with the success value
 * @returns The original Result unchanged
 * 
 * @example
 * ```ts
 * const result = success(42);
 * const tapped = tapSuccess(result, value => {
 *   console.log(`Successfully processed: ${value}`);
 * });
 * // tapped is still { status: "success", data: 42 }
 * ```
 */
export function tapSuccess<T, E>(
    result: Result<T, E>,
    fn: (data: T) => void
): Result<T, E> {
    // Only execute function for success results
    if (result.status === "success") {
        fn(result.data);
    }
    // Return the original result unchanged
    return result;
}