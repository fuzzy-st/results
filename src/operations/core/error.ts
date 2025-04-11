import type { Result } from "~/types";

/**
 * Wraps the data into an error result
 *
 * @param error - The error to wrap
 * 
 * @example
 * ```ts
 * const result = error(new Error("Something went wrong"));
 * 
 * if (result.status === "error") {
 *   // The type of result is now { status: "error"; error: Error }
 *   console.error(result.error); // Error: Something went wrong
 *  }
 * ```
 */
export function error<E = Error>(error: E): Result<never, E> {
    return { status: "error", error };
}