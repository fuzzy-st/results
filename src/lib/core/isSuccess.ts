import type { Result } from "~/types";

/**
 * Type guard to check if a result *result* of an operation was **successful**.
 * 
 * @param result - The result to check
 * @returns true if the result is a success, false otherwise
 * @example
 * ```ts
 * const result = success("Hello, world!");
 * 
 * if (isSuccess(result)) {
 *   // The type of result is now { status: "success"; data: string }
 *   console.log(result.data); // "Hello, world!"
 * }
 * ```
*/
export function isSuccess<T, E>(
    result: Result<T, E>,
): result is { status: "success"; data: T } {
    return result !== null
        && typeof result === "object"
        && result.status === "success"
        && (result.data !== null || typeof result.data === "object");
}