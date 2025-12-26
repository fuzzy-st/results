import assert from "node:assert";
import test, { describe } from "node:test";
import { asyncChain } from "~/lib/async/asyncChain";
import { error } from "~/lib/core/error";
import { isError } from "~/lib/core/isError";
import { isSuccess } from "~/lib/core/isSuccess";
import { success } from "~/lib/core/success";

describe("(ASYNC) `asyncChain` function", () => {
  test("should transform success result with async function that returns success", async () => {
    const successResult = success(5);
    const asyncTransform = async (x: number) => success(x * 2);

    const chainedResult = await asyncChain(successResult, asyncTransform);

    assert.strictEqual(isSuccess(chainedResult), true);
    assert.strictEqual(chainedResult.status, "success");
    assert.strictEqual(chainedResult.data, 10);
  });

  test("should transform success result with async function that returns error", async () => {
    const successResult = success(5);
    const asyncTransform = async (x: number) =>
      x > 10 ? success(x * 2) : error(new Error("Value too small"));

    const chainedResult = await asyncChain(successResult, asyncTransform);

    assert.strictEqual(isError(chainedResult), true);
    assert.strictEqual(chainedResult.status, "error");
    assert.strictEqual(chainedResult.error.message, "Value too small");
  });

  test("should pass through error results unchanged", async () => {
    const originalError = new Error("Original error");
    const errorResult = error(originalError);
    const asyncTransform = async (_x: any) => success("This should not be called");

    const chainedResult = await asyncChain(errorResult, asyncTransform);

    assert.strictEqual(isError(chainedResult), true);
    assert.strictEqual(chainedResult.status, "error");
    assert.strictEqual(chainedResult.error, originalError);
  });

  test("should catch exceptions thrown in async function", async () => {
    const successResult = success(5);
    const asyncThrowingTransform = async () => {
      throw new Error("Async function error");
    };

    const chainedResult = await asyncChain(successResult, asyncThrowingTransform);

    assert.strictEqual(isError(chainedResult), true);
    assert.strictEqual(chainedResult.status, "error");
    assert.strictEqual(chainedResult.error.message, "Async function error");
  });

  test("should handle complex data transformations", async () => {
    interface User {
      id: number;
      name: string;
    }

    interface Post {
      id: number;
      userId: number;
      title: string;
    }

    interface UserWithPosts {
      user: User;
      posts: Post[];
    }

    // Mock database
    const posts = [
      { id: 1, userId: 1, title: "First post" },
      { id: 2, userId: 1, title: "Second post" },
      { id: 3, userId: 2, title: "Another post" },
    ];

    const user: User = { id: 1, name: "John" };
    const successResult = success(user);

    // Async function to fetch user posts
    const fetchUserPosts = async (user: User) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      const userPosts = posts.filter((post) => post.userId === user.id);

      return success<UserWithPosts>({
        user,
        posts: userPosts,
      });
    };

    const chainedResult = await asyncChain(successResult, fetchUserPosts);

    assert.strictEqual(isSuccess(chainedResult), true);
    if (isSuccess(chainedResult)) {
      assert.strictEqual(chainedResult.data.user, user);
      assert.strictEqual(chainedResult.data.posts.length, 2);
      assert.strictEqual(chainedResult.data.posts[0].title, "First post");
    }
  });

  test("should handle promises rejected in async function", async () => {
    const successResult = success(5);

    const asyncRejectingFunction = async () => {
      await Promise.reject(new Error("Promise rejected"));
      return success("Never reached");
    };

    const chainedResult = await asyncChain(successResult, asyncRejectingFunction);

    assert.strictEqual(isError(chainedResult), true);
    assert.strictEqual(chainedResult.error.message, "Promise rejected");
  });

  test("should convert non-Error exceptions to Error objects", async () => {
    const successResult = success(5);

    // String exception
    const stringThrowingFunction = async () => {
      throw "String error";
    };

    const stringResult = await asyncChain(successResult, stringThrowingFunction);
    assert.strictEqual(isError(stringResult), true);
    assert.ok(stringResult.error instanceof Error);
    assert.strictEqual(stringResult.error.message, "String error");

    // Object exception
    const objectThrowingFunction = async () => {
      throw { code: 404, message: "Not found" };
    };

    const objectResult = await asyncChain(successResult, objectThrowingFunction);
    assert.strictEqual(isError(objectResult), true);
    assert.ok(objectResult.error instanceof Error);
    assert.ok(objectResult.error.message.includes("[object Object]"));
  });

  test("should handle multiple chainings", async () => {
    const initialResult = success(5);

    // Chained async operations
    const step1 = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return success(x * 2);
    };

    const step2 = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return x > 5 ? success(x + 1) : error(new Error("Too small"));
    };

    const step3 = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return success(x.toString());
    };

    // Chain operations
    const result1 = await asyncChain(initialResult, step1);
    assert.strictEqual(isSuccess(result1), true);

    const result2 = await asyncChain(result1, step2);
    assert.strictEqual(isSuccess(result2), true);

    const result3 = await asyncChain(result2, step3);
    assert.strictEqual(isSuccess(result3), true);

    if (isSuccess(result3)) {
      assert.strictEqual(result3.data, "11"); // (5 * 2) + 1 -> '11'
    }

    // Test error short-circuiting
    const smallResult = success(2);
    const chainedOp1 = await asyncChain(smallResult, step1); // 2 * 2 = 4
    const chainedOp2 = await asyncChain(chainedOp1, step2); // 4 < 5, returns error

    assert.strictEqual(isError(chainedOp2), true);
    assert.strictEqual(chainedOp2.error.message, "Too small");

    // This shouldn't execute step3 as chainedOp2 is an error
    const chainedOp3 = await asyncChain(chainedOp2, step3);

    assert.strictEqual(isError(chainedOp3), true);
    assert.strictEqual(chainedOp3.error.message, "Too small");
  });
});
