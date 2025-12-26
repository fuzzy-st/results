import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import { tap } from "~/lib/transformers/tap";

describe("(CORE) `tap` function", () => {
  test("should return the same success result without modification", () => {
    const originalResult = success(42);
    let tapCalled = false;

    const tappedResult = tap(originalResult, (_result) => {
      tapCalled = true;
    });

    assert.strictEqual(tapCalled, true, "Tap function should be called");
    assert.strictEqual(tappedResult, originalResult, "Should return the exact same result object");
    assert.strictEqual(tappedResult.status, "success");
    assert.strictEqual(tappedResult.data, 42);
  });

  test("should return the same error result without modification", () => {
    const originalError = new Error("Test error");
    const originalResult = error(originalError);
    let tapCalled = false;

    const tappedResult = tap(originalResult, (_result) => {
      tapCalled = true;
    });

    assert.strictEqual(tapCalled, true, "Tap function should be called");
    assert.strictEqual(tappedResult, originalResult, "Should return the exact same result object");
    assert.strictEqual(tappedResult.status, "error");
    assert.strictEqual(tappedResult.error, originalError);
  });

  test("should allow interrogating the result in the tap function", () => {
    const successResult = success("test data");
    let statusInTap = "";
    let dataInTap = "";

    tap(successResult, (result) => {
      statusInTap = result.status;
      if (result.status === "success") {
        dataInTap = result.data;
      }
    });

    assert.strictEqual(statusInTap, "success");
    assert.strictEqual(dataInTap, "test data");

    const errorResult = error(new Error("test error"));
    let errorStatusInTap = "";
    let errorMessageInTap = "";

    tap(errorResult, (result) => {
      errorStatusInTap = result.status;
      if (result.status === "error") {
        errorMessageInTap = result.error.message;
      }
    });

    assert.strictEqual(errorStatusInTap, "error");
    assert.strictEqual(errorMessageInTap, "test error");
  });

  test("should support multiple taps in sequence", () => {
    const result = success(42);
    const calls: string[] = [];

    const finalResult = tap(
      tap(
        tap(result, () => calls.push("first")),
        () => calls.push("second"),
      ),
      () => calls.push("third"),
    );

    assert.deepStrictEqual(calls, ["first", "second", "third"]);
    assert.strictEqual(finalResult, result);
  });

  test("should allow side effects within the tap function", () => {
    const result = success([1, 2, 3]);
    const sideEffectArray: number[] = [];

    const tappedResult = tap(result, (r) => {
      if (r.status === "success") {
        // Side effect: modify external array
        sideEffectArray.push(...r.data);
      }
    });

    assert.deepStrictEqual(sideEffectArray, [1, 2, 3]);
    assert.strictEqual(tappedResult, result);
  });

  test("should handle exceptions in the tap function", () => {
    const result = success(42);

    // The exception should propagate out
    assert.throws(() => {
      tap(result, () => {
        throw new Error("Exception in tap");
      });
    }, /Exception in tap/);

    // But the original result should remain unchanged
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, 42);
  });
});
