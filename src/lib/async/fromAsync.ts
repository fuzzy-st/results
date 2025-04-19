import type { Result } from "~/types";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";

/**
 * Wraps an async function to return a Result, capturing any errors
 * 
 * @param fn - Async function to wrap
 * @returns Wrapped function that returns a Promise<Result>
 * 
 * @example
 * ```ts
 * // Create a safe version of an async function
 * const safeGetUser = fromAsync(
 *   async (id: string) => {
 *     const response = await fetch(`/api/users/${id}`);
 *     if (!response.ok) throw new Error(`HTTP error ${response.status}`);
 *     return response.json();
 *   }
 * );
 * 
 * // Use the safe function
 * const result = await safeGetUser("123");
 * // result is either { status: "success", data: User } 
 * // or { status: "error", error: Error }
 * ```
 */
export function fromAsync<T, A extends any[]>(
    fn: (...args: A) => Promise<T>
): (...args: A) => Promise<Result<T, Error>> {
    return async (...args: A) => {
        try {
            const data = await fn(...args);
            return success(data);
        } catch (e) {
            return error(
                e instanceof Error ? e : new Error(String(e))
            );
        }
    };
}