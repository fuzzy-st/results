/**
 * A type representing the result of an operation that can succeed or fail
 * @type T - The type of data returned on success
 * @type E - The type of error returned on failure (default: Error)
 */
export type Result<T, E = Error> = { status: "success"; data: T } | { status: "error"; error: E };
