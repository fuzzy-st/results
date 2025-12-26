import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import { tapSuccess } from "~/lib/transformers/tapSuccess";

describe("(CORE) `tapSuccess` function", () => {
  test("should call the function for success results", () => {
    const successResult = success(42);
    let tapCalled = false;
    let receivedValue: number | null = null;

    const tappedResult = tapSuccess(successResult, (value) => {
      tapCalled = true;
      receivedValue = value;
    });

    assert.strictEqual(tapCalled, true, "Tap function should be called for success");
    assert.strictEqual(receivedValue, 42, "Should receive the success value");
    assert.strictEqual(tappedResult, successResult, "Should return the exact same result object");
  });

  test("should not call the function for error results", () => {
    const errorResult = error(new Error("Test error"));
    let tapCalled = false;

    const tappedResult = tapSuccess(errorResult, () => {
      tapCalled = true;
    });

    assert.strictEqual(tapCalled, false, "Tap function should not be called for error");
    assert.strictEqual(tappedResult, errorResult, "Should return the exact same result object");
  });

  test("should support complex data types", () => {
    const complexData = { id: 1, name: "Test", tags: ["a", "b", "c"] };
    const successResult = success(complexData);
    let receivedData: typeof complexData | null = null;

    tapSuccess(successResult, (data) => {
      receivedData = data;
      // Try modifying a property (should not affect original)
      data.name = "Modified";
    });

    assert.strictEqual(receivedData, complexData, "Should receive the same object reference");
    assert.strictEqual(
      complexData.name,
      "Modified",
      "Modification affects original (by reference)",
    );
    assert.strictEqual(successResult.status, "success");
    assert.strictEqual(successResult.data, complexData);
  });

  test("should allow multiple taps in sequence", () => {
    const result = success("hello");
    const actions: string[] = [];

    const finalResult = tapSuccess(
      tapSuccess(
        tapSuccess(result, (data) => {
          actions.push(`Length: ${data.length}`);
        }),
        (data) => {
          actions.push(`Uppercase: ${data.toUpperCase()}`);
        },
      ),
      (data) => {
        actions.push(`First char: ${data[0]}`);
      },
    );

    assert.deepStrictEqual(actions, ["Length: 5", "Uppercase: HELLO", "First char: h"]);
    assert.strictEqual(finalResult, result);
  });

  test("should allow side effects without changing the result", () => {
    const result = success([1, 2, 3]);
    const sideEffectArray: number[] = [];

    const tappedResult = tapSuccess(result, (data) => {
      // Side effect: modify external array
      sideEffectArray.push(...data);
    });

    assert.deepStrictEqual(sideEffectArray, [1, 2, 3]);
    assert.strictEqual(tappedResult, result);
  });

  test("should handle exceptions in the tap function", () => {
    const result = success(42);

    // The exception should propagate out
    assert.throws(() => {
      tapSuccess(result, () => {
        throw new Error("Exception in tap");
      });
    }, /Exception in tap/);

    // But the original result should remain unchanged
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, 42);
  });
});
