import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

/**
 * Converts a Promise to a Promise<Result>
 *
 * @param promise - The Promise to convert
 * @param errorTransformer - Optional function to transform caught errors
 * @returns A Promise that resolves to a Result
 *
 * @example
 * ```ts
 * // Convert a fetch promise to a Result
 * const result = await fromPromise(fetch('https://api.example.com/data'));
 *
 * // With custom error transformation
 * const result = await fromPromise(
 *   fetch('https://api.example.com/data'),
 *   err => new ApiError(500, `API request failed: ${err.message}`)
 * );
 * ```
 */
export async function fromPromise<T, E extends Error = Error>(
  promise: Promise<T>,
  errorTransformer?: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return success(data);
  } catch (e) {
    const err = errorTransformer
      ? errorTransformer(e)
      : e instanceof Error
        ? (e as E)
        : (new Error(String(e)) as E);

    return error(err);
  }
}
