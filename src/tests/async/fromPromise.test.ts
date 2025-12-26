import assert from "node:assert";
import test, { describe } from "node:test";
import { fromPromise } from "~/lib/async/fromPromise";
import { isError } from "~/lib/core/isError";
import { isSuccess } from "~/lib/core/isSuccess";

describe("(ASYNC) `fromPromise` function", () => {
  test("should convert resolved promise to success result", async () => {
    const promise = Promise.resolve(42);
    const result = await fromPromise(promise);

    assert.strictEqual(isSuccess(result), true);
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, 42);
  });

  test("should convert rejected promise to error result", async () => {
    const error = new Error("Promise failed");
    const promise = Promise.reject(error);
    const result = await fromPromise(promise);

    assert.strictEqual(isError(result), true);
    assert.strictEqual(result.status, "error");
    assert.strictEqual(result.error, error);
  });

  test("should handle non-Error rejection values", async () => {
    const stringRejection = Promise.reject("Invalid state");
    const stringResult = await fromPromise(stringRejection);

    assert.strictEqual(isError(stringResult), true);
    assert.ok(stringResult.error instanceof Error);
    assert.strictEqual(stringResult.error.message, "Invalid state");

    const numberRejection = Promise.reject(404);
    const numberResult = await fromPromise(numberRejection);

    assert.strictEqual(isError(numberResult), true);
    assert.ok(numberResult.error instanceof Error);
    assert.strictEqual(numberResult.error.message, "404");

    const objectRejection = Promise.reject({ code: 500, message: "Server error" });
    const objectResult = await fromPromise(objectRejection);

    assert.strictEqual(isError(objectResult), true);
    assert.ok(objectResult.error instanceof Error);
    assert.ok(objectResult.error.message.includes("[object Object]"));
  });

  test("should use custom error transformer if provided", async () => {
    class ApiError extends Error {
      constructor(
        public code: number,
        message: string,
      ) {
        super(message);
        this.name = "ApiError";
      }
    }

    const transformer = (err: unknown) => new ApiError(500, `API error: ${String(err)}`);
    const promise = Promise.reject("Server unavailable");
    const result = await fromPromise(promise, transformer);

    assert.strictEqual(isError(result), true);
    assert.ok(result.error instanceof ApiError);
    assert.strictEqual((result.error as ApiError).code, 500);
    assert.strictEqual(result.error.message, "API error: Server unavailable");
  });

  test("should handle various promise value types", async () => {
    // String promise
    const stringPromise = Promise.resolve("hello");
    const stringResult = await fromPromise(stringPromise);
    assert.strictEqual(isSuccess(stringResult), true);
    assert.strictEqual(stringResult.data, "hello");

    // Object promise
    const objPromise = Promise.resolve({ name: "John", age: 30 });
    const objResult = await fromPromise(objPromise);
    assert.strictEqual(isSuccess(objResult), true);
    assert.deepStrictEqual(objResult.data, { name: "John", age: 30 });

    // Array promise
    const arrayPromise = Promise.resolve([1, 2, 3]);
    const arrayResult = await fromPromise(arrayPromise);
    assert.strictEqual(isSuccess(arrayResult), true);
    assert.deepStrictEqual(arrayResult.data, [1, 2, 3]);

    // Null/undefined promises
    const nullPromise = Promise.resolve(null);
    const nullResult = await fromPromise(nullPromise);
    assert.strictEqual(isSuccess(nullResult), true);
    assert.strictEqual(nullResult.data, null);

    const undefinedPromise = Promise.resolve(undefined);
    const undefinedResult = await fromPromise(undefinedPromise);
    assert.strictEqual(isSuccess(undefinedResult), true);
    assert.strictEqual(undefinedResult.data, undefined);
  });
});
