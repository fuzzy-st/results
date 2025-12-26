import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { isError } from "~/lib/core/isError";
import { success } from "~/lib/core/success";

describe("(CORE) `isError` function", () => {
  test("it should correctly identify error results", () => {
    const errorResult = error(new Error("Something went wrong"));
    assert.strictEqual(isError(errorResult), true);
  });

  test('it should return false for "successful" results', () => {
    const successResult = success(42);
    assert.strictEqual(isError(successResult), false);
  });

  test("it should handle various error types", () => {
    // Standard Error
    const standardError = error(new Error("Standard error"));
    assert.strictEqual(isError(standardError), true);

    // Custom Error
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }
    const customError = error(new CustomError("Custom error"));
    assert.strictEqual(isError(customError), true);

    // Primitive error
    const primitiveError = error("Primitive error");
    assert.strictEqual(isError(primitiveError), true);
  });

  test("it should return false for invalid Result objects", () => {
    const invalidResults = [
      { status: "unknown" }, // Invalid status
      { status: "success" }, // Missing data
      { status: "error" }, // Missing error
      { status: "success", data: undefined }, // Invalid data
      { status: "error", error: undefined }, // Invalid error
    ];
    invalidResults.forEach((result) => {
      //@ts-expect-error
      assert.strictEqual(isError(result), false);
    });
    //@ts-expect-error
    assert.strictEqual(isError({}), false); // Empty object
    //@ts-expect-error
    assert.strictEqual(isError(null), false); // Null value
    //@ts-expect-error
    assert.strictEqual(isError(undefined), false); // Undefined value
    //@ts-expect-error
    assert.strictEqual(isError(42), false); // Primitive value
    //@ts-expect-error
    assert.strictEqual(isError("error"), false); // String value
    //@ts-expect-error
    assert.strictEqual(isError(true), false); // Boolean value
    //@ts-expect-error
    assert.strictEqual(isError([]), false); // Array
    //@ts-expect-error
    assert.strictEqual(isError({ status: "error", error: null }), false); // Null error
    //@ts-expect-error
    assert.strictEqual(isError({ status: "error", data: null }), false); // Null data
  });

  test("it should work with type narrowing", () => {
    const result = Math.random() > 0.5 ? success(42) : error(new Error("Random error"));

    if (isError(result)) {
      // Type should be narrowed to error result
      assert.ok(result.error);
    } else {
      // Type should be narrowed to success result
      assert.ok(result.data);
    }
  });
  test("should handle union of different error types", () => {
    class ErrorA extends Error {
      constructor(public readonly code: number) {
        super("Error A");
        this.name = "ErrorA";
      }
    }

    class ErrorB extends Error {
      constructor(public readonly items: string[]) {
        super("Error B");
        this.name = "ErrorB";
      }
    }

    function getResult(amount: number) {
      if (amount > 100) {
        return error(new ErrorA(1));
      }
      if (amount > 10) {
        return error(new ErrorB(["item1", "item2"]));
      }
      return success("success");
    }

    // Test ErrorA case
    const resultA = getResult(101);
    assert.strictEqual(isError(resultA), true);
    if (isError(resultA)) {
      // TypeScript should know this is ErrorA | ErrorB
      assert.strictEqual(resultA.error.name, "ErrorA");
      if (resultA.error instanceof ErrorA) {
        assert.strictEqual(resultA.error.code, 1);
      }
    }

    // Test ErrorB case
    const resultB = getResult(50);
    assert.strictEqual(isError(resultB), true);
    if (isError(resultB)) {
      assert.strictEqual(resultB.error.name, "ErrorB");
      if (resultB.error instanceof ErrorB) {
        assert.deepStrictEqual(resultB.error.items, ["item1", "item2"]);
      }
    }

    // Test success case
    const resultSuccess = getResult(5);
    assert.strictEqual(isError(resultSuccess), false);
  });

  test("should handle union of error types with different properties", () => {
    class NetworkError extends Error {
      constructor(
        public readonly statusCode: number,
        public readonly url: string,
      ) {
        super(`Network error: ${statusCode}`);
        this.name = "NetworkError";
      }
    }

    class ValidationError extends Error {
      constructor(
        public readonly field: string,
        public readonly constraint: string,
      ) {
        super(`Validation error on ${field}`);
        this.name = "ValidationError";
      }
    }

    class DatabaseError extends Error {
      constructor(
        public readonly query: string,
        public readonly details: Record<string, unknown>,
      ) {
        super("Database error");
        this.name = "DatabaseError";
      }
    }

    function performOperation(type: "network" | "validation" | "database" | "success") {
      switch (type) {
        case "network":
          return error(new NetworkError(404, "https://api.example.com"));
        case "validation":
          return error(new ValidationError("email", "must be valid"));
        case "database":
          return error(new DatabaseError("SELECT * FROM users", { code: "ER_DUP" }));
        case "success":
          return success({ data: "operation completed" });
      }
    }

    const networkResult = performOperation("network");
    if (isError(networkResult)) {
      if (networkResult.error instanceof NetworkError) {
        assert.strictEqual(networkResult.error.statusCode, 404);
        assert.strictEqual(networkResult.error.url, "https://api.example.com");
      }
    }

    const validationResult = performOperation("validation");
    if (isError(validationResult)) {
      if (validationResult.error instanceof ValidationError) {
        assert.strictEqual(validationResult.error.field, "email");
        assert.strictEqual(validationResult.error.constraint, "must be valid");
      }
    }

    const databaseResult = performOperation("database");
    if (isError(databaseResult)) {
      if (databaseResult.error instanceof DatabaseError) {
        assert.strictEqual(databaseResult.error.query, "SELECT * FROM users");
        assert.deepStrictEqual(databaseResult.error.details, { code: "ER_DUP" });
      }
    }
  });

  test("should handle union with primitive error types", () => {
    function getResult(type: "string-error" | "number-error" | "object-error" | "success") {
      switch (type) {
        case "string-error":
          return error("String error message");
        case "number-error":
          return error(404);
        case "object-error":
          return error({ code: "ERR_001", message: "Custom error object" });
        case "success":
          return success("all good");
      }
    }

    const stringError = getResult("string-error");
    if (isError(stringError)) {
      assert.strictEqual(typeof stringError.error, "string");
      assert.strictEqual(stringError.error, "String error message");
    }

    const numberError = getResult("number-error");
    if (isError(numberError)) {
      assert.strictEqual(typeof numberError.error, "number");
      assert.strictEqual(numberError.error, 404);
    }

    const objectError = getResult("object-error");
    if (isError(objectError)) {
      assert.strictEqual(typeof objectError.error, "object");
      assert.deepStrictEqual(objectError.error, {
        code: "ERR_001",
        message: "Custom error object",
      });
    }
  });
});
