import type { Result } from "~/types";

/**
 * Pattern matching for Results
 *
 * Simple, type-inferred pattern matching for Results. Both handlers can return
 * different types, and TypeScript will correctly infer the return type.
 *
 * @param result - The result to match
 * @param matchers - The matchers to use
 * @param matchers.success - The function to call if the result is a success
 * @param matchers.error - The function to call if the result is an error
 * @typeParam T - The type of data contained in the Result
 * @typeParam E - The type of error contained in the Result
 *
 * @example
 * ```ts
 * // Returns a string
 * const message = Result.match(userResult, {
 *   success: (user) => `Hello ${user.name}`,
 *   error: (err) => `Error: ${err.message}`
 * });
 *
 * // Returns User | null with proper type inference
 * const maybeUser = Result.match(userResult, {
 *   success: (user) => user,
 *   error: () => null
 * });
 * ```
 */
export function match<T, E, S, F>(
  result: Result<T, E>,
  matchers: {
    success: (value: T) => S;
    error: (error: E) => F;
  },
): S | F {
  if (result.status === "success") {
    return matchers.success(result.data);
  }
  return matchers.error(result.error);
}
