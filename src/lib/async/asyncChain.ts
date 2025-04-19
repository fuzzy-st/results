import type { Result } from "~/types";
import { isError } from "../core/isError";
import { isResult } from "../core/isResult";

/**
 * Chains async operations that return Results (flatMap for async)
 * 
 * Like `chain()` but for async transformations, allowing you to transform
 * a successful Result with an async function that might fail
 * 
 * @param result - The Result to transform
 * @param fn - Async function that transforms a success value and may return a Result
 * @returns A Promise resolving to a Result from the transformation or the original error
 * 
 * @example
 * ```ts
 * const userResult = success({ id: 1 });
 * 
 * // Chain to an async operation that might fail
 * const postsResult = await asyncChain(userResult, async user => {
 *   try {
 *     const response = await fetch(`/api/users/${user.id}/posts`);
 *     if (!response.ok) throw new Error(`HTTP error ${response.status}`);
 *     const posts = await response.json();
 *     return success(posts);
 *   } catch (err) {
 *     return error(err);
 *   }
 * });
 * ```
 */
export async function asyncChain<T, U, E, F>(
    result: Result<T, E>,
    fn: (data: T) => Promise<Result<U, F>>
): Promise<Result<U, E | F>> {
    //Short-circuit for error results
    if (isError(result)) {
        return result;
    }

    // For success results, apply the async function
    try {
        if (!isResult(result)) {
            throw new Error("Result is not a valid Result Object");
        }
        return await (fn(result.data));

    } catch (e) {
        // If fn throws instead of returning an error Result,
        // convert the exception to an error Result
        // This is a type assertion to match F, caller must ensure compatibility
        return {
            status: "error",
            error: e instanceof Error
                ? (e as unknown as F)
                : (new Error(String(e)) as unknown as F)
        };
    }
}