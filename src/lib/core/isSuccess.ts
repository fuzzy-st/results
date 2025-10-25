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
export function isSuccess<R extends Result<any, any>>
    // The use of <any,any> is to allow for type preservation
    (
        result: R,
    ): result is Extract<R, { status: "success" }> {
    return result !== null
        && typeof result === "object"
        && result.status === "success"
        && (result.data !== null || typeof result.data === "object");
}