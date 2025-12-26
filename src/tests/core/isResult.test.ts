import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { isResult } from "~/lib/core/isResult";
import { success } from "~/lib/core/success";

describe("(CORE) `isResult` function", () => {
  test("should correctly identify success results", () => {
    const successResult = success(42);
    assert.strictEqual(isResult(successResult), true);
  });

  test("should correctly identify error results", () => {
    const errorResult = error(new Error("Something went wrong"));
    assert.strictEqual(isResult(errorResult), true);
  });

  test("should return false for non-result objects", () => {
    assert.strictEqual(isResult(null), false);
    assert.strictEqual(isResult(undefined), false);
    assert.strictEqual(isResult({}), false);
    assert.strictEqual(isResult({ status: "something" }), false);
    assert.strictEqual(isResult({ status: "success" }), false);
    assert.strictEqual(isResult({ status: "error" }), false);
  });

  test("should work with different data types", () => {
    const numberResult = success(42);
    const stringResult = success("hello");
    const objectResult = success({ key: "value" });
    const nullResult = success(null);
    const errorResult = error(new Error("Test"));

    assert.strictEqual(isResult(numberResult), true);
    assert.strictEqual(isResult(stringResult), true);
    assert.strictEqual(isResult(objectResult), true);
    assert.strictEqual(isResult(nullResult), true);
    assert.strictEqual(isResult(errorResult), true);
  });

  test("should work with type narrowing", () => {
    function processResult(result: unknown) {
      if (isResult(result)) {
        // At this point, result should be narrowed to a Result type
        assert.ok("status" in result);
        assert.ok(["success", "error"].includes(result.status));
      } else {
        assert.ok(!("status" === null));
      }
    }

    processResult(success(42));
    processResult(error(new Error("Test")));
    processResult(null);
  });
});
