import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import { tapError } from "~/lib/transformers/tapError";

describe("(CORE) `tapError` function", () => {
  test("should call the function for error results", () => {
    const originalError = new Error("Test error");
    const errorResult = error(originalError);
    let tapCalled = false;
    let receivedError: Error | null = null;

    const tappedResult = tapError(errorResult, (err) => {
      tapCalled = true;
      receivedError = err as Error;
    });

    assert.strictEqual(tapCalled, true, "Tap function should be called for error");
    assert.strictEqual(receivedError, originalError, "Should receive the error value");
    assert.strictEqual(tappedResult, errorResult, "Should return the exact same result object");
  });

  test("should not call the function for success results", () => {
    const successResult = success(42);
    let tapCalled = false;

    const tappedResult = tapError(successResult, () => {
      tapCalled = true;
    });

    assert.strictEqual(tapCalled, false, "Tap function should not be called for success");
    assert.strictEqual(tappedResult, successResult, "Should return the exact same result object");
  });

  test("should support custom error types", () => {
    class CustomError extends Error {
      constructor(
        public code: number,
        message: string,
      ) {
        super(message);
        this.name = "CustomError";
      }
    }

    const customErr = new CustomError(404, "Not found");
    const errorResult = error(customErr);
    let receivedError: CustomError | null = null;

    tapError(errorResult, (err) => {
      receivedError = err as CustomError;
    });

    assert.strictEqual(receivedError, customErr, "Should receive the same error reference");
    assert.strictEqual(receivedError?.code, 404, "Should access custom properties");
  });

  test("should allow multiple taps in sequence", () => {
    const errorInstance = new Error("Test error");
    const result = error(errorInstance);
    const actions: string[] = [];

    const finalResult = tapError(
      tapError(
        tapError(result, (err) => {
          actions.push(`Name: ${err.name}`);
        }),
        (err) => {
          actions.push(`Message: ${err.message}`);
        },
      ),
      (err) => {
        actions.push(`Has stack: ${Boolean(err.stack)}`);
      },
    );

    assert.deepStrictEqual(actions, ["Name: Error", "Message: Test error", "Has stack: true"]);
    assert.strictEqual(finalResult, result);
  });

  test("should allow side effects without changing the result", () => {
    const errorInstance = new Error("Test error");
    const result = error(errorInstance);
    const errorLog: string[] = [];

    const tappedResult = tapError(result, (err) => {
      // Side effect: log error
      errorLog.push(`Error: ${err.message}`);
    });

    assert.deepStrictEqual(errorLog, ["Error: Test error"]);
    assert.strictEqual(tappedResult, result);
  });

  test("should handle exceptions in the tap function", () => {
    const errorInstance = new Error("Original error");
    const result = error(errorInstance);

    // The exception should propagate out
    assert.throws(() => {
      tapError(result, () => {
        throw new Error("Exception in tap");
      });
    }, /Exception in tap/);

    // But the original result should remain unchanged
    assert.strictEqual(result.status, "error");
    assert.strictEqual(result.error, errorInstance);
  });
});
