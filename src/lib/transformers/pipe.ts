import type { Result } from "~/types";
import { isResult } from "~/lib/core/isResult";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";

/**
 * Type helper for pipe functions array
 */
type PipeFns<T, R, E> = [(value: T) => R | Result<R, E>, ...Array<(value: any) => any>];

/**
 * Recursive type to infer the final result type of a pipe operation
 */
type PipeResult<T, Fns extends PipeFns<any, any, any>> = Fns extends [
    (value: infer A) => infer B | Result<infer B, infer E>,
    ...infer Rest
]
    ? Rest extends PipeFns<B, any, any>
    ? PipeResult<B, Rest> extends Result<infer R, infer E2>
    ? Result<R, E | E2>
    : never
    : Result<B, E>
    : Result<T, never>;

/**
 * Special case overload for empty transformation list
 */
export function pipe<T>(initialValue: T): Result<T, never>;
export function pipe<T, E>(initialValue: Result<T, E>): Result<T, E>;

/**
 * Main pipe function type
 */
export function pipe<T, Fns extends PipeFns<T, any, any>>(
    initialValue: T | Result<T, any>,
    ...fns: Fns
): PipeResult<T, Fns>;

/**
 * Creates a pipeline of transformations from an initial value or Result
 * 
 * @param initialValue - The starting value or Result
 * @param fns - Functions to apply in sequence
 * @returns The final Result after applying all transformations
 * 
 * @example
 * ```ts
 * // Simple value transformations
 * const result1 = pipe(
 *   5,
 *   value => value * 2,
 *   value => value + 1
 * ); // Result<11, never>
 * 
 * // Mix of transformations and validations
 * const result2 = pipe(
 *   'input',
 *   value => value.length >= 3 ? value : error(new Error("Too short")),
 *   value => value.toUpperCase()
 * ); // Result<"INPUT", Error>
 * ```
 */
export function pipe(
    initialValue: any,
    ...fns: Array<(value: any) => any>
): Result<any, any> {
    // Handle empty transformation list
    if (fns.length === 0) {
        return isResult(initialValue)
            ? initialValue
            : success(initialValue);
    }

    // Handle initialValue being a Result
    let currentValue: any = initialValue;
    if (isResult(currentValue)) {
        if (currentValue.status === "error") {
            return currentValue; // Short-circuit immediately
        }
        currentValue = currentValue.data; // Unwrap for processing
    }

    // Apply each function in the pipeline
    let hasError = false;
    let errorValue: any = null;

    for (let i = 0; i < fns.length; i++) {
        if (hasError) break;

        try {
            // Apply the function
            const fn = fns[i];
            const result = fn(currentValue);

            // Check if result is a Result
            if (isResult(result)) {
                if (result.status === "error") {
                    hasError = true;
                    errorValue = result.error;
                    break;
                }
                currentValue = result.data; // Unwrap for next function
            } else {
                currentValue = result; // Regular value, pass along
            }
        } catch (err) {
            // Catch any exceptions and convert to error Result
            hasError = true;
            errorValue = err;
            break;
        }
    }

    // Return appropriate Result
    if (hasError) {
        return { status: "error", error: errorValue };
    }

    return success(currentValue);
}

