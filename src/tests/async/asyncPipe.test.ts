import assert from 'node:assert';
import test, { describe } from 'node:test';
import { asyncPipe } from '~/lib/async/asyncPipe';
import { success } from '~/lib/core/success';
import { error } from '~/lib/core/error';
import { isSuccess } from '~/lib/core/isSuccess';
import { isError } from '~/lib/core/isError';

describe('(ASYNC) `asyncPipe` function', () => {
    test('should handle initial value with transformations', async () => {
        const initialValue = 5;

        const result = await asyncPipe(
            initialValue,
            async x => x * 2,
            async x => x + 1
        );

        assert.strictEqual(isSuccess(result), true);
        assert.strictEqual(result.status, 'success');
        assert.strictEqual(result.data, 11); // (5 * 2) + 1
    });

    test('should handle initial Result with transformations', async () => {
        const initialResult = success(5);

        const result = await asyncPipe(
            initialResult,
            async x => x * 2,
            async x => x + 1
        );

        assert.strictEqual(isSuccess(result), true);
        assert.strictEqual(result.data, 11);
    });

    test('should short-circuit on error results', async () => {
        let secondFunctionCalled = false;

        const result = await asyncPipe(
            5,
            async x => x > 10 ? success(x) : error(new Error('Value too small')),
            async x => {
                secondFunctionCalled = true;
                return x * 2;
            }
        );

        assert.strictEqual(isError(result), true);
        assert.strictEqual(result.error.message, 'Value too small');
        assert.strictEqual(secondFunctionCalled, false, 'Second function should not be called after error');
    });

    test('should catch exceptions in transformation functions', async () => {
        const result = await asyncPipe(
            5,
            async x => {
                throw new Error('Something went wrong');
            },
            async x => x * 2
        );

        assert.strictEqual(isError(result), true);
        assert.strictEqual(result.error.message, 'Something went wrong');
    });

    test('should handle functions that return Results directly', async () => {
        const result = await asyncPipe(
            5,
            async x => success(x * 2),
            async x => success(x + 1)
        );

        assert.strictEqual(isSuccess(result), true);
        assert.strictEqual(result.data, 11);
    });

    test('should handle mix of Result and non-Result returns', async () => {
        const result = await asyncPipe(
            5,
            async x => x * 2,         // Returns 10
            async x => success(x + 1), // Returns success(11)
            async x => x.toString()    // Returns "11"
        );

        assert.strictEqual(isSuccess(result), true);
        assert.strictEqual(result.data, "11");
    });

    test('should handle initial error Result', async () => {
        const initialError = error(new Error('Initial error'));
        let functionCalled = false;

        const result = await asyncPipe(
            initialError,
            async x => {
                functionCalled = true;
                return x * 2;
            }
        );

        assert.strictEqual(isError(result), true);
        assert.strictEqual(result.error.message, 'Initial error');
        assert.strictEqual(functionCalled, false, 'Function should not be called with initial error');
    });

    test('should handle zero transformations', async () => {
        // With simple value
        const valueResult = await asyncPipe(5);
        assert.strictEqual(isSuccess(valueResult), true);
        assert.strictEqual(valueResult.data, 5);

        // With success Result
        const successResult = await asyncPipe(success('test'));
        assert.strictEqual(isSuccess(successResult), true);
        assert.strictEqual(successResult.data, 'test');

        // With error Result
        const errorObj = new Error('Test error');
        const errorResult = await asyncPipe(error(errorObj));
        assert.strictEqual(isError(errorResult), true);
        assert.strictEqual(errorResult.error, errorObj);
    });

    test('should handle complex async data transformations', async () => {
        interface User {
            id: number;
            name: string;
        }

        interface Post {
            id: number;
            title: string;
            authorId: number;
        }

        interface Comment {
            id: number;
            postId: number;
            text: string;
        }

        interface ProcessedData {
            user: User;
            posts: Post[];
            commentCounts: Record<number, number>;
        }

        // Mock data
        const users: User[] = [{ id: 1, name: 'John' }];
        const posts: Post[] = [
            { id: 101, title: 'Post 1', authorId: 1 },
            { id: 102, title: 'Post 2', authorId: 1 }
        ];
        const comments: Comment[] = [
            { id: 1001, postId: 101, text: 'Comment 1' },
            { id: 1002, postId: 101, text: 'Comment 2' },
            { id: 1003, postId: 102, text: 'Comment 3' }
        ];

        // Transformation functions
        const fetchUser = async (userId: number): Promise<User> => {
            const user = users.find(u => u.id === userId);
            if (!user) throw new Error(`User ${userId} not found`);
            return user;
        };

        const fetchPosts = async (user: User): Promise<{ user: User; posts: Post[] }> => {
            return {
                user,
                posts: posts.filter(p => p.authorId === user.id)
            };
        };

        const countComments = async (data: { user: User; posts: Post[] }): Promise<ProcessedData> => {
            const commentCounts: Record<number, number> = {};

            for (const post of data.posts) {
                commentCounts[post.id] = comments.filter(c => c.postId === post.id).length;
            }

            return {
                ...data,
                commentCounts
            };
        };

        // Execute pipeline
        const result = await asyncPipe(
            1, // User ID
            fetchUser,
            fetchPosts,
            countComments
        );

        assert.strictEqual(isSuccess(result), true);
        if (isSuccess(result)) {
            const data = result.data as ProcessedData;
            assert.strictEqual(data.user.name, 'John');
            assert.strictEqual(data.posts.length, 2);
            assert.strictEqual(data.commentCounts[101], 2);
            assert.strictEqual(data.commentCounts[102], 1);
        }
    });

    test('should convert non-Error exceptions to Error objects', async () => {
        // String exception
        const stringResult = await asyncPipe(
            5,
            async () => { throw 'String error'; }
        );

        assert.strictEqual(isError(stringResult), true);
        assert.ok(stringResult.error instanceof Error);
        assert.strictEqual(stringResult.error.message, 'String error');

        // Object exception
        const objectResult = await asyncPipe(
            5,
            async () => { throw { code: 404, message: 'Not found' }; }
        );

        assert.strictEqual(isError(objectResult), true);
        assert.ok(objectResult.error instanceof Error);
        assert.ok(objectResult.error.message.includes('[object Object]'));
    });

    test('should handle rejected promises in transformation functions', async () => {
        const result = await asyncPipe(
            5,
            async () => Promise.reject(new Error('Promise rejected'))
        );

        assert.strictEqual(isError(result), true);
        assert.strictEqual(result.error.message, 'Promise rejected');
    });
});