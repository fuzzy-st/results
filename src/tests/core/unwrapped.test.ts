import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import { unwrap } from "~/lib/core/unwrap";
import { unwrapOr } from "~/lib/core/unwrapOr";

describe("(CORE) `unwrap` function", () => {
  test("should extract value from successful results", () => {
    const successResult = success(42);
    assert.strictEqual(unwrap(successResult), 42);
  });

  test("should throw an error when unwrapping an error result", () => {
    const errorResult = error(new Error("Something went wrong"));
    assert.throws(() => unwrap(errorResult), /Something went wrong/);
  });

  test("should work with different data types", () => {
    // Number
    const numberResult = success(42);
    assert.strictEqual(unwrap(numberResult), 42);

    // String
    const stringResult = success("hello");
    assert.strictEqual(unwrap(stringResult), "hello");

    // Object
    const objectResult = success({ name: "John", age: 30 });
    assert.deepStrictEqual(unwrap(objectResult), { name: "John", age: 30 });

    // Null
    const nullResult = success(null);
    assert.strictEqual(unwrap(nullResult), null);
  });

  test("should preserve the original error when throwing", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    const errorResult = error(new CustomError("Custom error"));

    try {
      unwrap(errorResult);
    } catch (err) {
      assert(err instanceof CustomError);
      assert.strictEqual(err.message, "Custom error");
      assert.strictEqual(err.name, "CustomError");
    }
  });
});

describe("(CORE) `unwrapOr function", () => {
  test("should extract value from successful results", () => {
    const successResult = success(42);
    assert.strictEqual(unwrapOr(successResult, 0), 42);
  });

  test("should return the default value when unwrapping an error result", () => {
    const errorResult = error(new Error("Something went wrong"));
    assert.strictEqual(unwrapOr(errorResult, 0), 0);
  });

  test("should work with different data types", () => {
    // Number
    const numberSuccessResult = success(42);
    assert.strictEqual(unwrapOr(numberSuccessResult, 0), 42);
    const numberErrorResult = error(new Error("Number error"));
    assert.strictEqual(unwrapOr(numberErrorResult, 0), 0);

    // String
    const stringSuccessResult = success("hello");
    assert.strictEqual(unwrapOr(stringSuccessResult, "default"), "hello");
    const stringErrorResult = error(new Error("String error"));
    assert.strictEqual(unwrapOr(stringErrorResult, "default"), "default");

    // Object
    const defaultUser = { id: 0, name: "Guest" };
    const userSuccessResult = success({ id: 1, name: "John" });
    assert.deepStrictEqual(unwrapOr(userSuccessResult, defaultUser), { id: 1, name: "John" });
    const userErrorResult = error(new Error("User error"));
    assert.deepStrictEqual(unwrapOr(userErrorResult, defaultUser), defaultUser);

    // Null
    const nullResult = success(null);
    assert.strictEqual(unwrapOr(nullResult, {}), null);

    // Error
    const errorResult = error(new Error("Something went wrong"));
    assert.strictEqual(unwrapOr(errorResult, "default"), "default");
    assert.strictEqual(unwrapOr(errorResult, undefined), undefined);
    assert.strictEqual(unwrapOr(errorResult, false), false);
    assert.strictEqual(unwrapOr(errorResult, 0), 0);

    // Undefined
    const undefinedResult = success(undefined);
    assert.strictEqual(unwrapOr(undefinedResult, "default"), undefined);
  });

  test("should work with lazy evaluation of default value", () => {
    // Default value as a function
    const errorResult = error(new Error("Computation error"));

    const defaultValueFn = () => {
      // Simulate some computation
      return 42;
    };

    assert.strictEqual(unwrapOr(errorResult, defaultValueFn()), 42);
  });

  test("should preserve type when using default value", () => {
    interface User {
      id: number;
      name: string;
    }

    const defaultUser: User = { id: 0, name: "Guest" };

    // Success case
    const successResult = success<User>({ id: 1, name: "John" });
    const successValue = unwrapOr(successResult, defaultUser);
    assert.deepStrictEqual(successValue, { id: 1, name: "John" });

    // Error case
    const errorResult = error(new Error("User not found"));
    const errorValue = unwrapOr(errorResult, defaultUser);
    assert.deepStrictEqual(errorValue, defaultUser);
  });

  test("should unwrap discriminated union success types", () => {
    function getResult(amount: number) {
      if (amount > 0) {
        return success({ type: "positive" as const, value: amount });
      }
      return success({ type: "zero" as const, value: 0 });
    }

    const positiveResult = getResult(10);
    const unwrapped = unwrap(positiveResult);

    // TypeScript should infer the union type correctly
    if (unwrapped.type === "positive") {
      assert.strictEqual(unwrapped.value, 10);
    }

    const zeroResult = getResult(0);
    const unwrappedZero = unwrap(zeroResult);

    if (unwrappedZero.type === "zero") {
      assert.strictEqual(unwrappedZero.value, 0);
    }
  });

  test("should unwrap union of different data types", () => {
    type StringResult = { format: "string"; data: string };
    type NumberResult = { format: "number"; data: number };
    type ArrayResult = { format: "array"; data: unknown[] };

    function getResult(type: "string" | "number" | "array") {
      switch (type) {
        case "string":
          return success<StringResult>({ format: "string", data: "hello" });
        case "number":
          return success<NumberResult>({ format: "number", data: 42 });
        case "array":
          return success<ArrayResult>({ format: "array", data: [1, 2, 3] });
      }
    }

    const stringResult = getResult("string");
    const stringData = unwrap(stringResult);
    assert.strictEqual(stringData.format, "string");
    assert.strictEqual(stringData.data, "hello");

    const numberResult = getResult("number");
    const numberData = unwrap(numberResult);
    assert.strictEqual(numberData.format, "number");
    assert.strictEqual(numberData.data, 42);

    const arrayResult = getResult("array");
    const arrayData = unwrap(arrayResult);
    assert.strictEqual(arrayData.format, "array");
    assert.deepStrictEqual(arrayData.data, [1, 2, 3]);
  });

  test("should throw when unwrapping error from union", () => {
    class CustomError extends Error {
      constructor(public readonly code: number) {
        super("Custom error");
      }
    }

    function getResult(shouldFail: boolean) {
      if (shouldFail) {
        return error(new CustomError(500));
      }
      return success({ status: "ok" });
    }

    const successResult = getResult(false);
    const data = unwrap(successResult);
    assert.deepStrictEqual(data, { status: "ok" });

    const errorResult = getResult(true);
    assert.throws(
      () => {
        unwrap(errorResult);
      },
      (err: unknown) => {
        return err instanceof CustomError && err.code === 500;
      },
    );
  });

  test("should handle complex nested discriminated unions", () => {
    type SuccessResponse =
      | { status: "created"; id: number; createdAt: Date }
      | { status: "updated"; id: number; updatedAt: Date }
      | { status: "deleted"; id: number };

    function performAction(action: "create" | "update" | "delete" | "error") {
      const now = new Date();
      switch (action) {
        case "create":
          return success<SuccessResponse>({ status: "created", id: 1, createdAt: now });
        case "update":
          return success<SuccessResponse>({ status: "updated", id: 1, updatedAt: now });
        case "delete":
          return success<SuccessResponse>({ status: "deleted", id: 1 });
        case "error":
          return error(new Error("Action failed"));
      }
    }

    const createResult = performAction("create");
    const createData = unwrap(createResult);
    if (createData.status === "created") {
      assert.strictEqual(createData.id, 1);
      assert.ok(createData.createdAt instanceof Date);
    }

    const updateResult = performAction("update");
    const updateData = unwrap(updateResult);
    if (updateData.status === "updated") {
      assert.strictEqual(updateData.id, 1);
      assert.ok(updateData.updatedAt instanceof Date);
    }

    const deleteResult = performAction("delete");
    const deleteData = unwrap(deleteResult);
    if (deleteData.status === "deleted") {
      assert.strictEqual(deleteData.id, 1);
      assert.strictEqual("createdAt" in deleteData, false);
      assert.strictEqual("updatedAt" in deleteData, false);
    }
  });
});
