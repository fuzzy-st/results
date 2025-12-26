import assert from "node:assert";
import test, { describe } from "node:test";
import { fromAsync } from "~/lib/async/fromAsync";
import { isError } from "~/lib/core/isError";
import { isSuccess } from "~/lib/core/isSuccess";

describe("(ASYNC) `fromAsync` function", () => {
  test("should return success result when async function resolves", async () => {
    // Async function that resolves
    async function fetchData() {
      return "data";
    }

    const safeFunction = fromAsync(fetchData);
    const result = await safeFunction();

    assert.strictEqual(isSuccess(result), true);
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, "data");
  });

  test("should return error result when async function throws", async () => {
    // Async function that throws
    async function fetchData() {
      throw new Error("Failed to fetch");
    }

    const safeFunction = fromAsync(fetchData);
    const result = await safeFunction();

    assert.strictEqual(isError(result), true);
    assert.strictEqual(result.status, "error");
    assert.strictEqual(result.error.message, "Failed to fetch");
  });

  test("should handle function with parameters", async () => {
    // Async function with parameters
    async function multiply(a: number, b: number) {
      return a * b;
    }

    const safeMultiply = fromAsync(multiply);
    const result = await safeMultiply(6, 7);

    assert.strictEqual(isSuccess(result), true);
    assert.strictEqual(result.data, 42);
  });

  test("should handle function that throws based on parameters", async () => {
    // Async function that throws conditionally
    async function divide(a: number, b: number) {
      if (b === 0) {
        throw new Error("Division by zero");
      }
      return a / b;
    }

    const safeDivide = fromAsync(divide);

    // Valid case
    const validResult = await safeDivide(10, 2);
    assert.strictEqual(isSuccess(validResult), true);
    assert.strictEqual(validResult.data, 5);

    // Error case
    const errorResult = await safeDivide(10, 0);
    assert.strictEqual(isError(errorResult), true);
    assert.strictEqual(errorResult.error.message, "Division by zero");
  });

  test("should convert non-Error exceptions to Error objects", async () => {
    // Async function that throws string
    async function throwString() {
      throw "String error";
    }

    const safeFunction = fromAsync(throwString);
    const result = await safeFunction();

    assert.strictEqual(isError(result), true);
    assert.ok(result.error instanceof Error);
    assert.strictEqual(result.error.message, "String error");

    // Async function that throws object
    async function throwObject() {
      throw { code: 500, message: "Server error" };
    }

    const safeFunction2 = fromAsync(throwObject);
    const result2 = await safeFunction2();

    assert.strictEqual(isError(result2), true);
    assert.ok(result2.error instanceof Error);
    assert.ok(result2.error.message.includes("[object Object]"));
  });

  test("should preserve promise chain in returned function", async () => {
    // Chained promise with multiple async operations
    async function complexOperation() {
      const step1 = await Promise.resolve(5);
      const step2 = await Promise.resolve(step1 * 2);
      return step2 + 1;
    }

    const safeOperation = fromAsync(complexOperation);
    const result = await safeOperation();

    assert.strictEqual(isSuccess(result), true);
    assert.strictEqual(result.data, 11); // (5 * 2) + 1
  });

  test("should handle rejected promises inside the async function", async () => {
    // Async function with rejected promise
    async function fetchWithRejection() {
      return Promise.reject(new Error("Promise rejected"));
    }

    const safeFunction = fromAsync(fetchWithRejection);
    const result = await safeFunction();

    assert.strictEqual(isError(result), true);
    assert.strictEqual(result.error.message, "Promise rejected");
  });
});
