import assert from "node:assert";
import test, { describe } from "node:test";
import { isSuccess } from "~/lib/core/isSuccess";
import { success } from "~/lib/core/success";

describe("(CORE) `success` function", () => {
  test("should create a successful result with a number", () => {
    const result = success(42);

    assert.strictEqual(isSuccess(result), true);
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, 42);
  });

  test("should create a successful result with a string", () => {
    const result = success("hello");

    assert.strictEqual(isSuccess(result), true);
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, "hello");
  });

  test("should create a successful result with an object", () => {
    const user = { id: 1, name: "John" };
    const result = success(user);

    assert.strictEqual(isSuccess(result), true);
    assert.strictEqual(result.status, "success");
    assert.deepStrictEqual(result.data, user);
  });

  test("should create a successful result with null", () => {
    const result = success(null);

    assert.strictEqual(isSuccess(result), true);
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, null);
  });

  test("should create a successful result with undefined", () => {
    const result = success(undefined);

    assert.strictEqual(isSuccess(result), true);
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, undefined);
  });

  test("should maintain type inference", () => {
    // Number
    const numberResult = success(42);
    //@ts-expect-error
    assert.deepStrictEqual<number>(numberResult.status, "success");
    //@ts-expect-error
    assert.deepStrictEqual<number>(numberResult.data, 42);

    // String
    const stringResult = success("hello");
    //@ts-expect-error
    assert.deepStrictEqual<string>(stringResult.data, "hello");

    // Object
    const objectResult = success({ id: 1, name: "John" });
    //@ts-expect-error
    assert.deepStrictEqual(objectResult.data, { id: 1, name: "John" });

    // Null
    const nullResult = success(null);
    //@ts-expect-error
    assert.deepStrictEqual<null>(nullResult.data, null);
  });

  test("should work with complex types", () => {
    // Union type
    const unionResult = success<number | string>(42);
    assert.strictEqual(isSuccess(unionResult), true);
    //@ts-expect-error
    assert.strictEqual(unionResult.data, 42);

    // Generic type
    interface User {
      id: number;
      name: string;
    }
    const user: User = { id: 1, name: "John" };
    const genericResult = success<User>(user);
    assert.strictEqual(isSuccess(genericResult), true);
    //@ts-expect-error
    assert.deepStrictEqual(genericResult.data, user);
  });
});
