import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import { map } from "~/lib/transformers/map";

describe("(CORE) `map` function", () => {
  test("should transform success values", () => {
    const successResult = success(42);
    const mappedResult = map(successResult, (x) => x * 2);

    assert.strictEqual(mappedResult.status, "success");
    assert.strictEqual(mappedResult.data, 84);
  });

  test("should not transform error values", () => {
    const testError = new Error("Test error");
    const errorResult = error(testError);
    const mappedResult = map(errorResult, (x) => x * 2);

    assert.strictEqual(mappedResult.status, "error");
    assert.strictEqual(mappedResult.error, testError);
  });

  test("should work with complex transformations", () => {
    const successResult = success({ name: "John", age: 30 });
    const mappedResult = map(successResult, (user) => ({
      username: user.name.toLowerCase(),
      isAdult: user.age >= 18,
    }));

    assert.strictEqual(mappedResult.status, "success");
    assert.deepStrictEqual(mappedResult.data, {
      username: "john",
      isAdult: true,
    });
  });

  test("should handle functions that return different types", () => {
    const numberResult = success(42);

    // Map from number to string
    const stringResult = map(numberResult, (x) => x.toString());
    assert.strictEqual(stringResult.status, "success");
    assert.strictEqual(typeof stringResult.data, "string");
    assert.strictEqual(stringResult.data, "42");

    // Map from number to boolean
    const boolResult = map(numberResult, (x) => x > 0);
    assert.strictEqual(boolResult.status, "success");
    assert.strictEqual(typeof boolResult.data, "boolean");
    assert.strictEqual(boolResult.data, true);

    // Map from number to object
    const objResult = map(numberResult, (x) => ({ value: x }));
    assert.strictEqual(objResult.status, "success");
    assert.strictEqual(typeof objResult.data, "object");
    assert.deepStrictEqual(objResult.data, { value: 42 });
  });

  test("should maintain error type", () => {
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
    const errorResult = error(customError);
    const mappedResult = map(errorResult, (x) => x * 2);

    assert.strictEqual(mappedResult.status, "error");
    assert.strictEqual(mappedResult.error, customError);
    assert.ok(mappedResult.error instanceof CustomError);
    assert.strictEqual((mappedResult.error as CustomError).code, 404);
  });
});
