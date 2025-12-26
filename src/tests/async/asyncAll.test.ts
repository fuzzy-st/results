import assert from "node:assert";
import test, { describe } from "node:test";
import { asyncAll } from "~/lib/async/asyncAll";
import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

describe("(ASYNC) `asyncAll` function", () => {
  test("should combine multiple successful results into one array", async () => {
    const results = [
      Promise.resolve(success(1)),
      Promise.resolve(success(2)),
      Promise.resolve(success(3)),
    ];

    const combinedResult = await asyncAll(results);

    assert.strictEqual(combinedResult.status, "success");
    assert.deepStrictEqual(combinedResult.data, [1, 2, 3]);
  });

  test("should return the first error encountered", async () => {
    const testError = new Error("Test error");

    const results = [
      Promise.resolve(success(1)),
      Promise.resolve(error(testError)),
      Promise.resolve(success(3)),
    ];

    const combinedResult = await asyncAll(results);

    assert.strictEqual(combinedResult.status, "error");
    assert.strictEqual(combinedResult.error, testError);
  });

  test("should handle mixed async and sync results", async () => {
    // Create a mix of immediate and delayed promises
    const results = [
      Promise.resolve(success(1)),
      new Promise<Result<number, Error>>((resolve) => {
        setTimeout(() => resolve(success(2)), 10);
      }),
      Promise.resolve(success(3)),
    ];

    const combinedResult = await asyncAll(results);

    assert.strictEqual(combinedResult.status, "success");
    assert.deepStrictEqual(combinedResult.data, [1, 2, 3]);
  });

  test("should handle rejected promises", async () => {
    const rejectionError = new Error("Promise rejected");

    const results = [
      Promise.resolve(success(1)),
      Promise.reject(rejectionError),
      Promise.resolve(success(3)),
    ];

    const combinedResult = await asyncAll(results);

    assert.strictEqual(combinedResult.status, "error");
    assert.strictEqual(combinedResult.error, rejectionError);
  });

  test("should handle empty array of results", async () => {
    const results: Promise<Result<any, any>>[] = [];

    const combinedResult = await asyncAll(results);

    assert.strictEqual(combinedResult.status, "success");
    assert.deepStrictEqual(combinedResult.data, []);
  });

  test("should preserve error types", async () => {
    class CustomError extends Error {
      constructor(
        public code: number,
        message: string,
      ) {
        super(message);
        this.name = "CustomError";
      }
    }

    const customError = new CustomError(404, "Not found");

    const results = [
      Promise.resolve(success(1)),
      Promise.resolve(error(customError)),
      Promise.resolve(success(3)),
    ];

    const combinedResult = await asyncAll(results);

    assert.strictEqual(combinedResult.status, "error");
    assert.strictEqual(combinedResult.error, customError);
    assert.ok(combinedResult.error instanceof CustomError);
    assert.strictEqual((combinedResult.error as CustomError).code, 404);
  });
});
