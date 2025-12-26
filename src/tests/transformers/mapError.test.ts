import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import { mapError } from "~/lib/transformers/mapError";

describe("(CORE) `mapError` function", () => {
  test("should transform error values", () => {
    const originalError = new Error("Original error");
    const errorResult = error(originalError);
    const mappedResult = mapError(errorResult, (err) => new Error(`Transformed: ${err.message}`));

    assert.strictEqual(mappedResult.status, "error");
    assert.notStrictEqual(mappedResult.error, originalError);
    assert.strictEqual((mappedResult.error as Error).message, "Transformed: Original error");
  });

  test("should not transform success values", () => {
    const successResult = success(42);
    const mappedResult = mapError(successResult, (_err) => new Error("This should not happen"));

    assert.strictEqual(mappedResult.status, "success");
    assert.strictEqual(mappedResult.data, 42);
  });

  test("should work with complex error transformations", () => {
    class NetworkError extends Error {
      constructor(
        public statusCode: number,
        message: string,
      ) {
        super(message);
        this.name = "NetworkError";
      }
    }

    class AppError extends Error {
      constructor(
        public code: string,
        public originalError: Error,
      ) {
        super(originalError.message);
        this.name = "AppError";
      }
    }

    const networkError = new NetworkError(404, "Resource not found");
    const errorResult = error(networkError);

    const mappedResult = mapError(errorResult, (err) => {
      if (err instanceof NetworkError && err.statusCode === 404) {
        return new AppError("RESOURCE_NOT_FOUND", err);
      }
      return new AppError("UNKNOWN_ERROR", err);
    });

    assert.strictEqual(mappedResult.status, "error");
    assert.ok(mappedResult.error instanceof AppError);
    assert.strictEqual((mappedResult.error as AppError).code, "RESOURCE_NOT_FOUND");
    assert.strictEqual((mappedResult.error as AppError).originalError, networkError);
  });

  test("should allow transforming to different error types", () => {
    // Transform Error to string
    const errorResult1 = error(new Error("Database connection failed"));
    const stringErrorResult = mapError(errorResult1, (err) => err.message);

    assert.strictEqual(stringErrorResult.status, "error");
    assert.strictEqual(typeof stringErrorResult.error, "string");
    assert.strictEqual(stringErrorResult.error, "Database connection failed");

    // Transform Error to object
    const errorResult2 = error(new Error("Validation failed"));
    const objectErrorResult = mapError(errorResult2, (err) => ({
      message: err.message,
      timestamp: Date.now(),
      type: "VALIDATION_ERROR",
    }));

    assert.strictEqual(objectErrorResult.status, "error");
    assert.strictEqual(typeof objectErrorResult.error, "object");
    assert.strictEqual((objectErrorResult.error as any).message, "Validation failed");
    assert.strictEqual((objectErrorResult.error as any).type, "VALIDATION_ERROR");
  });

  test("should maintain success type", () => {
    interface User {
      id: number;
      name: string;
    }

    const userResult = success<User>({ id: 1, name: "John" });
    const mappedResult = mapError(userResult, (_err) => new Error("Will not happen"));

    assert.strictEqual(mappedResult.status, "success");
    assert.deepStrictEqual(mappedResult.data, { id: 1, name: "John" });

    // TypeScript type check (would fail compilation if types don't match)
    const user: User = mappedResult.status === "success" ? mappedResult.data : { id: 0, name: "" };
    assert.deepStrictEqual(user, { id: 1, name: "John" });
  });
});
