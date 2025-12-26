import assert from "node:assert";
import test, { describe } from "node:test";
import { asyncMap } from "~/lib/async/asyncMap";
import { error } from "~/lib/core/error";
import { isError } from "~/lib/core/isError";
import { isSuccess } from "~/lib/core/isSuccess";
import { success } from "~/lib/core/success";

describe("(ASYNC) `asyncMap` function", () => {
  test("should transform success result with async function", async () => {
    const successResult = success(42);
    const asyncTransform = async (x: number) => x * 2;

    const mappedResult = await asyncMap(successResult, asyncTransform);

    assert.strictEqual(isSuccess(mappedResult), true);
    assert.strictEqual(mappedResult.status, "success");
    assert.strictEqual(mappedResult.data, 84);
  });

  test("should pass through error results unchanged", async () => {
    const originalError = new Error("Original error");
    const errorResult = error(originalError);
    const asyncTransform = async (x: number) => x * 2;

    const mappedResult = await asyncMap(errorResult, asyncTransform);

    assert.strictEqual(isError(mappedResult), true);
    assert.strictEqual(mappedResult.status, "error");
    assert.strictEqual(mappedResult.error, originalError);
  });

  test("should convert thrown errors in async function to error results", async () => {
    const successResult = success(42);
    const asyncThrowingTransform = async () => {
      throw new Error("Async transform error");
    };

    const mappedResult = await asyncMap(successResult, asyncThrowingTransform);

    assert.strictEqual(isError(mappedResult), true);
    assert.strictEqual(mappedResult.status, "error");
    assert.strictEqual(mappedResult.error.message, "Async transform error");
  });

  test("should handle complex data transformations", async () => {
    interface User {
      id: number;
      name: string;
    }

    interface UserDetails {
      id: number;
      name: string;
      posts: string[];
    }

    const user: User = { id: 1, name: "John" };
    const successResult = success(user);

    // Simulate fetching user posts
    const fetchUserPosts = async (user: User): Promise<UserDetails> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      return {
        ...user,
        posts: [`Post 1 by ${user.name}`, `Post 2 by ${user.name}`],
      };
    };

    const mappedResult = await asyncMap(successResult, fetchUserPosts);

    assert.strictEqual(isSuccess(mappedResult), true);
    assert.strictEqual(mappedResult.data.posts.length, 2);
    assert.strictEqual(mappedResult.data.name, "John");
    assert.strictEqual(mappedResult.data.posts[0], "Post 1 by John");
  });

  test("should handle rejected promises in async function", async () => {
    const successResult = success("test");

    const asyncRejectingTransform = async () => {
      return Promise.reject(new Error("Promise rejected"));
    };

    const mappedResult = await asyncMap(successResult, asyncRejectingTransform);

    assert.strictEqual(isError(mappedResult), true);
    assert.strictEqual(mappedResult.error.message, "Promise rejected");
  });

  test("should convert non-Error exceptions to Error objects", async () => {
    const successResult = success("test");

    // String rejection
    const stringRejectTransform = async () => {
      return Promise.reject("String error");
    };

    const stringResult = await asyncMap(successResult, stringRejectTransform);
    assert.strictEqual(isError(stringResult), true);
    assert.ok(stringResult.error instanceof Error);
    assert.strictEqual(stringResult.error.message, "String error");

    // Object rejection
    const objectRejectTransform = async () => {
      return Promise.reject({ code: 404, message: "Not found" });
    };

    const objectResult = await asyncMap(successResult, objectRejectTransform);
    assert.strictEqual(isError(objectResult), true);
    assert.ok(objectResult.error instanceof Error);
    assert.ok(objectResult.error.message.includes("[object Object]"));
  });
});
