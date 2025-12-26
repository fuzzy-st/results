import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { match } from "~/lib/core/match";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

describe("(CORE) `match` function", () => {
  test("match function - should handle successful results correctly", () => {
    const successResult = success(42);

    const output = match(successResult, {
      success: (value) => `Success: ${value}`,
      error: (err) => `Error: ${err.message}`,
    });

    assert.strictEqual(output, "Success: 42");
  });

  test("match function - should handle error results correctly", () => {
    const errorResult = error(new Error("Something went wrong"));

    const output = match(errorResult, {
      success: (value) => `Success: ${value}`,
      error: (err) => `Error: ${err.message}`,
    });

    assert.strictEqual(output, "Error: Something went wrong");
  });

  test("match function - should work with different data types", () => {
    // Number success
    const numberResult = success(42);
    const numberOutput = match(numberResult, {
      success: (value) => value * 2,
      error: () => 0,
    });
    assert.strictEqual(numberOutput, 84);

    // String success
    const stringResult = success("hello");
    const stringOutput = match(stringResult, {
      success: (value) => value.toUpperCase(),
      error: () => "",
    });
    assert.strictEqual(stringOutput, "HELLO");

    // Object success
    const objectResult = success({ name: "John", age: 30 });
    const objectOutput = match(objectResult, {
      success: (value) => `${value.name} is ${value.age}`,
      error: () => "Unknown",
    });
    assert.strictEqual(objectOutput, "John is 30");
  });

  test("match function - should maintain type inference", () => {
    const processResult = <T>(result: Result<T, Error>) =>
      match(result, {
        success: (value) => {
          return value;
        },
        error: (err) => {
          throw err;
        },
      });

    const numberResult = success(42);
    const processedNumber = processResult(numberResult);
    assert.strictEqual(processedNumber, 42);
  });

  test("match function - should handle async results", async () => {
    const asyncSuccessResult = success(Promise.resolve(42));

    const output = await match(asyncSuccessResult, {
      success: async (value) => {
        const resolvedValue = await value;
        return `Success: ${resolvedValue}`;
      },
      error: (err) => `Error: ${err.message}`,
    });

    assert.strictEqual(output, "Success: 42");
  });

  test("match function - should handle complex error scenarios", () => {
    class CustomError extends Error {
      constructor(public code: number) {
        super("Custom error");
        this.name = "CustomError";
      }
    }

    const customErrorResult = error(new CustomError(500));

    const output = match(customErrorResult, {
      success: () => "Never reached",
      error: (err) => {
        if (err instanceof CustomError) {
          return `Error ${err.code}: ${err.message}`;
        }
        return "Unknown error";
      },
    });

    assert.strictEqual(output, "Error 500: Custom error");
  });
});
