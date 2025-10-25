import type { Result } from "~/types";

/**
 * Unwraps a Result, returning the data or throwing the error
 *
 * @param result - The result to unwrap
 * @typeParam T - The type of data contained in the Result
 * @typeParam E - The type of error contained in the Result
 * @throws {E} The error contained in the Result if status is 'error'
 * @returns The data contained in the Result if status is 'success'
 * 
 * @example
 * ```ts
 * const unwrapped = unwrap(result);
 * // The type of unwrapped is T
 * ```
 */
export function unwrap<R extends Result<any, any>>(
    result: R
): Extract<R, { status: "success" }>["data"] {
    if (result.status === "error") {
        throw result.error;
    }
    return result.data;
}
