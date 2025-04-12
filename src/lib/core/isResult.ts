import type { Result } from "~/types";

/**
 * Type guard to check if a value is a result object.
 * @param value - The value to check if it is a result object
 * @returns true if the value is a result object, false otherwise
 * @example
 * ```ts
 * const result = success("Hello, world!");
 *  
 * if (isResult(result)) {
 *   // The type of result is now { status: "success"; data: string }
 *  console.log(result.data); // "Hello, world!"
 * }
 * ```
 */

export function isResult(value: any): value is Result<any, any> {
    return (
        !!value &&
        typeof value === "object" &&
        (value.status === "success" || value.status === "error")
        && (value.data !== undefined || value.error !== undefined)
        && (value.data !== null || value.error !== null)

    );
}