import assert from "node:assert";
import test, { describe } from "node:test";
import { error } from "~/lib/core/error";
import { success } from "~/lib/core/success";
import { pipe } from "~/lib/transformers/pipe";
import type { Result } from "~/types";

describe("(CORE) `pipe` function", () => {
  test("should apply transformations to an initial value", () => {
    const result = pipe(
      5,
      (value) => success(value * 2),
      (value) => success(value + 1),
    );

    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, 11);
  });

  test("should short-circuit on error", () => {
    let secondFunctionCalled = false;

    const result = pipe(
      5,
      (value) => (value > 10 ? success(value) : error(new Error("Value too small"))),
      (value) => {
        secondFunctionCalled = true;
        return success(value * 2);
      },
    );

    assert.strictEqual(result.status, "error");
    assert.strictEqual((result.error as Error).message, "Value too small");
    assert.strictEqual(
      secondFunctionCalled,
      false,
      "Second function should not be called after error",
    );
  });

  test("should work with different value types through the pipeline", () => {
    const result = pipe(
      5,
      (value) => success(value.toString()),
      (value) => success(`${value}!`),
      (value) => success(value.length),
    );

    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.data, 2);
  });

  test("should work with mixed error types", () => {
    class ValidationError extends Error {
      constructor(
        public field: string,
        message: string,
      ) {
        super(message);
        this.name = "ValidationError";
      }
    }

    class ProcessingError extends Error {
      constructor(
        public code: number,
        message: string,
      ) {
        super(message);
        this.name = "ProcessingError";
      }
    }

    // First transformation returns ValidationError
    const result1 = pipe("test", (value) =>
      value.length >= 5 ? success(value) : error(new ValidationError("input", "Too short")),
    );

    assert.strictEqual(result1.status, "error");
    assert.ok(result1.error instanceof ValidationError);
    assert.strictEqual((result1.error as ValidationError).field, "input");

    // Second transformation returns ProcessingError
    const result2 = pipe(
      "valid input",
      (value) =>
        value.length >= 5 ? success(value) : error(new ValidationError("input", "Too short")),
      (value) =>
        value.includes("error")
          ? success(value)
          : error(new ProcessingError(400, "Invalid content")),
    );

    assert.strictEqual(result2.status, "error");
    assert.ok(result2.error instanceof ProcessingError);
    assert.strictEqual((result2.error as ProcessingError).code, 400);
  });

  test("should handle empty transformation list", () => {
    // With initial value
    const result1 = pipe(42);
    assert.strictEqual(result1.status, "success");
    assert.strictEqual(result1.data, 42);

    // With initial Result
    const initialResult = success("test");
    const result2 = pipe(initialResult);
    assert.strictEqual(
      result2,
      initialResult,
      "Should return same Result object when no transformations",
    );
  });

  test("should handle complex transformations", () => {
    interface User {
      id: number;
      name: string;
    }

    interface UserStats {
      userId: number;
      postCount: number;
    }

    interface EnrichedUser {
      id: number;
      name: string;
      stats: UserStats;
    }

    // Mock data sources
    const users: Record<number, User> = {
      1: { id: 1, name: "Alice" },
      2: { id: 2, name: "Bob" },
    };

    const userStats: Record<number, UserStats> = {
      1: { userId: 1, postCount: 5 },
      2: { userId: 2, postCount: 3 },
    };

    // Pipeline operations
    function findUser(userId: number): Result<User, Error> {
      const user = users[userId];
      return user ? success(user) : error(new Error(`User ${userId} not found`));
    }

    function getUserStats(user: User): Result<UserStats, Error> {
      const stats = userStats[user.id];
      return stats ? success(stats) : error(new Error(`Stats for user ${user.id} not found`));
    }

    function enrichUser(user: User, stats: UserStats): Result<EnrichedUser, Error> {
      return success({
        ...user,
        stats,
      });
    }

    // Create complex pipeline
    const getUserWithStats = (userId: number) =>
      pipe(userId, findUser, (user) =>
        pipe(user, getUserStats, (stats) => enrichUser(user, stats)),
      );

    const existingUserResult = getUserWithStats(1);
    assert.strictEqual(existingUserResult.status, "success");
    assert.deepStrictEqual(existingUserResult.data, {
      id: 1,
      name: "Alice",
      stats: { userId: 1, postCount: 5 },
    });

    const nonExistingUserResult = getUserWithStats(999);
    assert.strictEqual(nonExistingUserResult.status, "error");
    assert.strictEqual((nonExistingUserResult.error as Error).message, "User 999 not found");
  });
});
