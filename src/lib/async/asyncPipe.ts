import { error } from "~/lib/core/error";
import { isResult } from "~/lib/core/isResult";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

/**
 * Type helper for async pipe functions array
 */
type AsyncPipeFns<T, _R, _E> = [
  (value: T) => Promise<Result<any, any>> | Result<any, any> | Promise<any> | any,
  ...Array<(value: any) => Promise<Result<any, any>> | Result<any, any> | Promise<any> | any>,
];

/**
 * Helper type to extract the value type from a Result or Promise<Result>
 */
type UnwrapResultValue<T> =
  T extends Result<infer V, any>
    ? V
    : T extends Promise<Result<infer V, any>>
      ? V
      : T extends Promise<infer V>
        ? V
        : T;

/**
 * Helper type to extract the error type from a Result or Promise<Result>
 */
type UnwrapResultError<T> =
  T extends Result<any, infer E> ? E : T extends Promise<Result<any, infer E>> ? E : never;

/**
 * Recursive type to infer the final result type of an async pipe operation
 */
type AsyncPipeResult<T, Fns extends AsyncPipeFns<any, any, any>> = Fns extends [
  (value: infer A) => infer B,
  ...infer Rest,
]
  ? Rest extends AsyncPipeFns<UnwrapResultValue<B>, any, any>
    ? AsyncPipeResult<UnwrapResultValue<B>, Rest> extends Promise<Result<infer R, infer E2>>
      ? Promise<Result<R, UnwrapResultError<B> | E2>>
      : never
    : Promise<Result<UnwrapResultValue<B>, UnwrapResultError<B>>>
  : Promise<Result<T, never>>;

/**
 * Special case overload for empty transformation list
 */
export function asyncPipe<T>(initialValue: T): Promise<Result<T, never>>;
export function asyncPipe<T, E>(
  initialValue: Result<T, E> | Promise<Result<T, E>>,
): Promise<Result<T, E>>;

/**
 * Main asyncPipe function type
 */
export function asyncPipe<T, Fns extends AsyncPipeFns<T, any, any>>(
  initialValue: T | Result<T, any> | Promise<T> | Promise<Result<T, any>>,
  ...fns: Fns
): AsyncPipeResult<T, Fns>;

/**
 * Creates a pipeline of async transformations from an initial value or Result
 *
 * Like `pipe()` but for async transformations, allowing you to create a pipeline
 * of async operations that might fail
 *
 * @param initialValue - The starting value, Result, Promise, or Promise<Result>
 * @param fns - Async functions to apply in sequence
 * @returns A Promise resolving to the final Result after all transformations
 *
 * @example
 * ```ts
 * // Create an async pipeline with error short-circuiting
 * const result = await asyncPipe(
 *   "user123",                  // Initial value
 *   fetchUser,                  // Fetch user by ID
 *   user => fetchUserPosts(user),  // Fetch user's posts
 *   posts => processUserPosts(posts)  // Process the posts
 * );
 * ```
 */
export async function asyncPipe(
  initialValue: any,
  ...fns: Array<(value: any) => any>
): Promise<Result<any, any>> {
  try {
    // Handle empty transformation list
    if (fns.length === 0) {
      return isResult(initialValue) ? initialValue : success(initialValue);
    }

    // Start with initial value, converting to Result if needed
    let currentValue: Result<any, any> = isResult(initialValue)
      ? initialValue
      : success(initialValue);

    // Apply each function in the pipeline
    for (let i = 0; i < fns.length; i++) {
      // Skip further processing if we already have an error
      if (currentValue.status === "error") {
        break;
      }

      const fn = fns[i];
      try {
        // Apply the function to the current success value
        const fnResult = await fn(currentValue.data);

        // Check if the function returned a Result
        if (isResult(fnResult)) {
          currentValue = fnResult;
        } else {
          // If not a Result, wrap in success
          currentValue = success(fnResult);
        }
      } catch (e) {
        // If the function throws, convert to error Result
        currentValue = error(e instanceof Error ? e : new Error(String(e)));
      }
    }

    // Return final value
    return currentValue;
  } catch (e) {
    // Handle any unexpected exceptions in the pipeline itself
    return error(e instanceof Error ? e : new Error(`Unexpected error in asyncPipe: ${String(e)}`));
  }
}
