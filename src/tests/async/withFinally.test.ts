import assert from "node:assert";
import test, { describe } from "node:test";
import { withFinally } from "~/lib/async/withFinally";
import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

describe("(ASYNC) `withFinally` function", () => {
  test("should execute finally function after successful result", async () => {
    let finallyCalled = false;
    const finallyFn = () => {
      finallyCalled = true;
    };

    const result = await withFinally(Promise.resolve(success(42)), finallyFn);

    assert.strictEqual(finallyCalled, true, "Finally function should be called");
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, 42);
  });

  test("should execute finally function after error result", async () => {
    let finallyCalled = false;
    const finallyFn = () => {
      finallyCalled = true;
    };

    const testError = new Error("Test error");
    const result = await withFinally(Promise.resolve(error(testError)), finallyFn);

    assert.strictEqual(finallyCalled, true, "Finally function should be called");
    assert.strictEqual(result.status, "error");
    assert.strictEqual(result.error, testError);
  });

  test("should execute finally function after delayed result", async () => {
    let finallyCalled = false;
    const finallyFn = () => {
      finallyCalled = true;
    };

    const delayedResult = new Promise<Result<number, Error>>((resolve) => {
      setTimeout(() => resolve(success(42)), 10);
    });

    const result = await withFinally(delayedResult, finallyFn);

    assert.strictEqual(finallyCalled, true, "Finally function should be called");
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, 42);
  });

  test("should execute finally function even if promise rejects", async () => {
    let finallyCalled = false;
    const finallyFn = () => {
      finallyCalled = true;
    };

    const rejectionError = new Error("Promise rejected");

    try {
      await withFinally(Promise.reject(rejectionError), finallyFn);
      assert.fail("Should have thrown the rejection error");
    } catch (err) {
      assert.strictEqual(err, rejectionError);
      assert.strictEqual(finallyCalled, true, "Finally function should be called");
    }
  });

  test("should support async finally functions", async () => {
    let finallyCalled = false;

    const asyncFinallyFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      finallyCalled = true;
    };

    const result = await withFinally(Promise.resolve(success(42)), asyncFinallyFn);

    assert.strictEqual(finallyCalled, true, "Async finally function should be called and awaited");
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, 42);
  });

  test("should propagate error from finally function and preserve original result", async () => {
    const finallyError = new Error("Finally error");
    const finallyFn = () => {
      throw finallyError;
    };

    try {
      await withFinally(Promise.resolve(success(42)), finallyFn);
      assert.fail("Should have thrown the finally error");
    } catch (err) {
      assert.strictEqual(err, finallyError);
    }
  });
});
