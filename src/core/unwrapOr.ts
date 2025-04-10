import type { Result } from "~/types";

/**
 * Returns the success data or a default value#
 * 
 * @param result - The result to unwrap
 * @param defaultValue - The default value to return if the result is an error
 * @typedef T - The type of data returned on success
 * @typedef E - The type of error returned on failure (default: Error)
 * @param result - The result to unwrap
 * 
 * 
 * @example
 * ```ts
 * const result = { status: "error", error: new Error("An error occurred") };
 * const defaultValue = "default value";
 * const unwrapped = unwrapOr(result, defaultValue);
 * // The type of unwrapped is string
 * console.log(unwrapped); // "default value"
 * ```  
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.status === "success" ? result.data : defaultValue;
}