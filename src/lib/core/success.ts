import type { Result } from "~/types";

/**
  * Wraps the data into a type-safe successful result.
  *
  * @param data - The data to wrap
  */
export function success<T, E = never>(data: T): Result<T, E> {
  return { status: "success", data };
}