import type { Result } from "~/types";

/**
 * Maps a result's error value to a new error
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  // Short-circuit for success case
  if (result.status === "success") {
    return result;
  }
  // Create minimal new object with mapped error
  return { status: "error", error: fn(result.error) };
}
