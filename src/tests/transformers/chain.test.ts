import assert from 'node:assert';
import test, { describe } from 'node:test';
import { chain } from '~/lib/transformers/chain';
import { success } from '~/lib/core/success';
import { error } from '~/lib/core/error';
import type { Result } from '~/types';

describe('(CORE) `chain` function', () => {
    test('should transform success values with functions that return success', () => {
        const successResult = success(42);
        const chainedResult = chain(successResult, n => success(n * 2));

        assert.strictEqual(chainedResult.status, 'success');
        assert.strictEqual(chainedResult.data, 84);
    });

    test('should transform success values with functions that may return error', () => {
        // Function that returns success for even numbers and error for odd numbers
        const validateEven = (n: number): Result<number, Error> => {
            return n % 2 === 0
                ? success(n)
                : error(new Error('Number must be even'));
        };

        // Success case
        const evenResult = success(42);
        const chainedEven = chain(evenResult, validateEven);
        assert.strictEqual(chainedEven.status, 'success');
        assert.strictEqual(chainedEven.data, 42);

        // Error case
        const oddResult = success(43);
        const chainedOdd = chain(oddResult, validateEven);
        assert.strictEqual(chainedOdd.status, 'error');
        assert.strictEqual((chainedOdd.error as Error).message, 'Number must be even');
    });

    test('should pass through original error results without calling the function', () => {
        const errorResult = error(new Error('Original error'));
        let functionCalled = false;

        const chainedResult = chain(errorResult, n => {
            functionCalled = true;
            return success('This should not happen');
        });

        assert.strictEqual(chainedResult.status, 'error');
        assert.strictEqual((chainedResult.error as Error).message, 'Original error');
        assert.strictEqual(functionCalled, false, 'Function should not be called for error results');
    });

    test('should work with complex transformations', () => {
        interface User {
            id: number;
            name: string;
        }

        interface Post {
            id: number;
            userId: number;
            title: string;
        }

        // Mock function to find posts by user
        function findPostsByUser(user: User): Result<Post[], Error> {
            if (user.id === 1) {
                return success([
                    { id: 101, userId: 1, title: 'First post' },
                    { id: 102, userId: 1, title: 'Second post' }
                ]);
            } else if (user.id === 2) {
                return success([]);
            } else {
                return error(new Error(`User ${user.id} not found`));
            }
        }

        // Test with user that has posts
        const userWithPosts = success<User>({ id: 1, name: 'John' });
        const postsResult1 = chain(userWithPosts, findPostsByUser);
        assert.strictEqual(postsResult1.status, 'success');
        assert.strictEqual((postsResult1.data as Post[]).length, 2);
        assert.strictEqual((postsResult1.data as Post[])[0].title, 'First post');

        // Test with user that has no posts
        const userWithoutPosts = success<User>({ id: 2, name: 'Jane' });
        const postsResult2 = chain(userWithoutPosts, findPostsByUser);
        assert.strictEqual(postsResult2.status, 'success');
        assert.strictEqual((postsResult2.data as Post[]).length, 0);

        // Test with invalid user
        const invalidUser = success<User>({ id: 999, name: 'Invalid' });
        const postsResult3 = chain(invalidUser, findPostsByUser);
        assert.strictEqual(postsResult3.status, 'error');
        assert.strictEqual((postsResult3.error as Error).message, 'User 999 not found');
    });

    test('should handle different error types', () => {
        class ValidationError extends Error {
            constructor(public field: string, message: string) {
                super(message);
                this.name = 'ValidationError';
            }
        }

        class DatabaseError extends Error {
            constructor(public code: number, message: string) {
                super(message);
                this.name = 'DatabaseError';
            }
        }

        // First, we have a success
        const initialResult = success(42);

        // Chain to a function that returns a DatabaseError
        const dbResult = chain(initialResult, n => error(new DatabaseError(500, 'Database connection failed')));
        assert.strictEqual(dbResult.status, 'error');
        assert.ok(dbResult.error instanceof DatabaseError);
        assert.strictEqual((dbResult.error as DatabaseError).code, 500);

        // Now start with a ValidationError
        const validationResult = error(new ValidationError('name', 'Name is required'));

        // Chain to a function that would return a DatabaseError
        const combinedResult = chain(validationResult, n => error(new DatabaseError(500, 'Database connection failed')));
        assert.strictEqual(combinedResult.status, 'error');
        assert.ok(combinedResult.error instanceof ValidationError);
        assert.strictEqual((combinedResult.error as ValidationError).field, 'name');
    });

    test('should handle multiple chains', () => {
        // Chain multiple operations that can fail
        function parseNumber(str: string): Result<number, Error> {
            const num = Number(str);
            return isNaN(num)
                ? error(new Error(`Failed to parse '${str}' as number`))
                : success(num);
        }

        function double(n: number): Result<number, Error> {
            return success(n * 2);
        }

        function requirePositive(n: number): Result<number, Error> {
            return n > 0
                ? success(n)
                : error(new Error('Number must be positive'));
        }

        // Successful chain
        const successfulChain = chain(
            chain(
                chain(
                    success('42'),
                    parseNumber
                ),
                double
            ),
            requirePositive
        );

        assert.strictEqual(successfulChain.status, 'success');
        assert.strictEqual(successfulChain.data, 84);

        // Failing at first step
        const failStep1 = chain(
            chain(
                chain(
                    success('not-a-number'),
                    parseNumber
                ),
                double
            ),
            requirePositive
        );

        assert.strictEqual(failStep1.status, 'error');
        assert.strictEqual((failStep1.error as Error).message, "Failed to parse 'not-a-number' as number");

        // Failing at last step
        const failStep3 = chain(
            chain(
                chain(
                    success('-5'),
                    parseNumber
                ),
                double
            ),
            requirePositive
        );

        assert.strictEqual(failStep3.status, 'error');
        assert.strictEqual((failStep3.error as Error).message, 'Number must be positive');
    });
});