import type { Result } from "~/types";

/**
  * Wraps the data into a type-safe successful result.
  *
  * @param data - The data to wrap
  */
export function success<T>(data: T): Result<T> {
    return { status: "success", data };
}