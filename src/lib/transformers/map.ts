import type { Result } from "~/types";

/**
 * Maps a result's success value to a new value
 *
 * @param result - The result to map
 * @param fn - The function to map the result's data
 * @returns A new result with the mapped data
 *
 * @example
 * ```ts
 * const result = { status: "success", data: 5 };
 * const mappedResult = map(result, (data) => data * 2);
 * console.log(mappedResult); // { status: "success", data: 10 }
 *
 * const result = { status: "error", error: new Error("Something went wrong") };
 * const mappedResult = map(result, (data) => data * 2);
 * console.log(mappedResult); // { status: "error", error: new Error("Something went wrong") }
 * ```
 */
export function map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
  // Short-circuit for error case
  if (result.status === "error") {
    return result;
  }
  // Create minimal new object with mapped data
  return { status: "success", data: fn(result.data) };
}
