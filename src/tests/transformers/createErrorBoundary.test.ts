import assert from 'node:assert';
import test, { describe } from 'node:test';
import { isSuccess } from '~/lib/core/isSuccess';
import { isError } from '~/lib/core/isError';
import { createErrorBoundary } from '~/lib/transformers/createErrorBoundary';

describe('(CORE) `createErrorBoundary` function', () => {
    test('should return success result for non-throwing function', () => {
        const boundary = createErrorBoundary(err => new Error(`Caught: ${err}`));

        const result = boundary(() => 42);

        assert.strictEqual(isSuccess(result), true);
        assert.strictEqual(result.status, 'success');
        assert.strictEqual(result.data, 42);
    });

    test('should return error result with transformed error for throwing function', () => {
        const boundary = createErrorBoundary(err =>
            err instanceof Error ? err : new Error(`Unknown error: ${String(err)}`)
        );

        const error = new Error('Test error');
        const result = boundary(() => {
            throw error;
        });

        assert.strictEqual(isError(result), true);
        assert.strictEqual(result.status, 'error');
        assert.strictEqual(result.error, error);
    });

    test('should transform non-Error exceptions into proper errors', () => {
        const boundary = createErrorBoundary(err => {
            if (err instanceof Error) return err;
            return new Error(`Transformed: ${String(err)}`);
        });

        // String exception
        const stringResult = boundary(() => {
            throw 'String exception';
        });

        assert.strictEqual(isError(stringResult), true);
        assert.ok(stringResult.error instanceof Error);
        assert.strictEqual(stringResult.error.message, 'Transformed: String exception');

        // Number exception
        const numberResult = boundary(() => {
            throw 42;
        });

        assert.strictEqual(isError(numberResult), true);
        assert.ok(numberResult.error instanceof Error);
        assert.strictEqual(numberResult.error.message, 'Transformed: 42');

        // Object exception
        const objectResult = boundary(() => {
            throw { code: 500, message: 'Server error' };
        });

        assert.strictEqual(isError(objectResult), true);
        assert.ok(objectResult.error instanceof Error);
        assert.strictEqual(objectResult.error.message, 'Transformed: [object Object]');
    });

    test('should allow custom error types', () => {
        class ApiError extends Error {
            constructor(public statusCode: number, message: string) {
                super(message);
                this.name = 'ApiError';
            }
        }

        const apiBoundary = createErrorBoundary(err => {
            if (err instanceof Error) {
                return new ApiError(500, err.message);
            }
            return new ApiError(400, String(err));
        });

        const result = apiBoundary(() => {
            throw new Error('Connection timeout');
        });

        assert.strictEqual(isError(result), true);
        assert.ok(result.error instanceof ApiError);
        assert.strictEqual(result.error.statusCode, 500);
        assert.strictEqual(result.error.message, 'Connection timeout');
    });

    test('should work with async functions when awaited', async () => {
        const boundary = createErrorBoundary(err =>
            err instanceof Error ? err : new Error(`Async error: ${String(err)}`)
        );

        // Non-throwing async function
        const successResult = boundary(async () => {
            await Promise.resolve();
            return 'async result';
        });

        // We need to await the Promise that's inside the success result
        if (isSuccess(successResult) && successResult.data instanceof Promise) {
            const resolvedData = await successResult.data;
            assert.strictEqual(resolvedData, 'async result');
        } else {
            assert.fail('Expected a success result with a Promise');
        }

        // Throwing async function
        const errorResult = boundary(() => {
            return Promise.reject(new Error('Async rejection'));
        });

        // For a rejected Promise, we'd get an error about an unhandled rejection
        // instead of catching it in the boundary because the Promise rejection happens
        // after the function returns
        assert.strictEqual(isSuccess(errorResult), true);

        try {
            if (isSuccess(errorResult) && errorResult.data instanceof Promise) {
                await errorResult.data;
                assert.fail('Expected promise to reject');
            }
        } catch (err) {
            assert.ok(err instanceof Error);
            assert.strictEqual(err.message, 'Async rejection');
        }
    });

    test('should handle functions that return Results', () => {
        // It's important to note that if a function already returns a Result,
        // the boundary will wrap it in another Result, so you'd need to unwrap
        const boundary = createErrorBoundary(err => new Error(`Boundary error: ${err}`));

        // Function that returns a success Result
        const successResult = boundary(() => ({ status: 'success' as const, data: 42 }));

        assert.strictEqual(isSuccess(successResult), true);
        assert.deepStrictEqual(successResult.data, { status: 'success', data: 42 });

        // Function that returns an error Result
        const errorObj = new Error('Inner error');
        const nestedErrorResult = boundary(() => ({ status: 'error' as const, error: errorObj }));

        assert.strictEqual(isSuccess(nestedErrorResult), true);
        assert.deepStrictEqual(nestedErrorResult.data, { status: 'error', error: errorObj });
    });
});