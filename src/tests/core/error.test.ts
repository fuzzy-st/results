import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { isError } from "~/lib/core/isError";

describe("(CORE) `error` function", () => {
  test("should create an error result with a standard Error", () => {
    const standardError = error(new Error("Something went wrong"));

    assert.strictEqual(isError(standardError), true);
    assert.strictEqual(standardError.status, "error");
    assert(standardError.error instanceof Error);
    assert.strictEqual(standardError.error.message, "Something went wrong");
  });

  test("should create an error result with a custom error type", () => {
    class ValidationError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "ValidationError";
      }
    }

    const customError = error(new ValidationError("Invalid input"));

    assert.strictEqual(isError(customError), true);
    assert.strictEqual(customError.status, "error");
    assert(customError.error instanceof ValidationError);
    assert.strictEqual(customError.error.message, "Invalid input");
  });

  test("should create an error result with a primitive value", () => {
    const primitiveError = error("Connection failed");

    assert.strictEqual(isError(primitiveError), true);
    assert.strictEqual(primitiveError.status, "error");
    assert.strictEqual(primitiveError.error, "Connection failed");
  });

  test("should maintain type safety with complex error objects", () => {
    interface DatabaseError extends Error {
      code: number;
      context?: Record<string, unknown>;
    }

    const complexError: DatabaseError = {
      name: "DatabaseError",
      message: "Connection failed",
      code: 500,
      context: {
        timestamp: new Date(),
        operation: "connect",
      },
    };

    const result = error(complexError);

    assert.strictEqual(isError(result), true);
    assert.strictEqual(result.status, "error");
    assert.deepStrictEqual(result.error, complexError);
  });
});
