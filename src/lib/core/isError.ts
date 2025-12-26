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
 *
 *  console.log(result.error.message); // "Something went wrong!"
 * }
 * ```
 */

export function isError<R extends Result<any, any>>(
  //The use of <any,any> here is to allow type preservation
  result: R,
): result is Extract<R, { status: "error" }> {
  return (
    typeof result === "object" &&
    result !== null &&
    result.status === "error" &&
    result.error !== undefined &&
    (result.error instanceof Error ||
      typeof result.error === "string" ||
      typeof result.error === "object") &&
    result.error !== null
  );
}
