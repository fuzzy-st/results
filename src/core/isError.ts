import type { Result } from "~/types";

/**
 * Type guard to check if a result *result* of an operation was **unsuccessful**.
 * @param result - The result to check
 * @returns true if the result is an error, false otherwise
 * 
 * @example
 * ```ts
 * const result = error(new Error("Something went wrong!"));
 * 
 * if (isError(result)) {
 *  // The type of result is now { status: "error"; error: Error }
 *  console.log(result.error.message); // "Something went wrong!"
 * }
 * ```
 */
export function isError<T, E>(result: Result<T, E>): result is { status: "error"; error: E } {
    return result.status === "error";
}