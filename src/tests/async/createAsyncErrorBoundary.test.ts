import assert from 'node:assert';
import test, { describe } from 'node:test';
import { createAsyncErrorBoundary } from '~/lib/async/createAsyncErrorBoundary';
import { isSuccess } from '~/lib/core/isSuccess';
import { isError } from '~/lib/core/isError';

describe('(ASYNC) `createAsyncErrorBoundary` function', () => {
    test('should return success result for non-throwing async function', async () => {
        const boundary = createAsyncErrorBoundary(err => new Error(`Caught: ${err}`));

        const result = await boundary(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return 42;
        });

        assert.strictEqual(isSuccess(result), true);
        assert.strictEqual(result.status, 'success');
        assert.strictEqual(result.data, 42);
    });

    test('should return error result with transformed error for throwing async function', async () => {
        const boundary = createAsyncErrorBoundary(err =>
            err instanceof Error ? err : new Error(`Unknown error: ${String(err)}`)
        );

        const thrownError = new Error('Async test error');
        const result = await boundary(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            throw thrownError;
        });

        assert.strictEqual(isError(result), true);
        assert.strictEqual(result.status, 'error');
        assert.strictEqual(result.error, thrownError);
    });

    test('should transform non-Error exceptions into proper errors', async () => {
        const boundary = createAsyncErrorBoundary(err => {
            if (err instanceof Error) return err;
            return new Error(`Transformed: ${String(err)}`);
        });

        // String exception
        const stringResult = await boundary(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            throw 'String exception';
        });

        assert.strictEqual(isError(stringResult), true);
        assert.ok(stringResult.error instanceof Error);
        assert.strictEqual(stringResult.error.message, 'Transformed: String exception');

        // Object exception
        const objectResult = await boundary(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            throw { code: 500, message: 'Server error' };
        });

        assert.strictEqual(isError(objectResult), true);
        assert.ok(objectResult.error instanceof Error);
        assert.strictEqual(objectResult.error.message, 'Transformed: [object Object]');
    });

    test('should handle rejected promises', async () => {
        const boundary = createAsyncErrorBoundary(err =>
            err instanceof Error ? err : new Error(`Unknown error: ${String(err)}`)
        );

        const rejectionError = new Error('Promise rejected');
        const result = await boundary(async () => {
            await Promise.reject(rejectionError);
            return 'This will not be reached';
        });

        assert.strictEqual(isError(result), true);
        assert.strictEqual(result.error, rejectionError);
    });

    test('should allow custom error types', async () => {
        class ApiError extends Error {
            constructor(public statusCode: number, message: string) {
                super(message);
                this.name = 'ApiError';
            }
        }

        const apiBoundary = createAsyncErrorBoundary(err => {
            if (err instanceof Error) {
                return new ApiError(500, err.message);
            }
            return new ApiError(400, String(err));
        });

        const result = await apiBoundary(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            throw new Error('Connection timeout');
        });

        assert.strictEqual(isError(result), true);
        assert.ok(result.error instanceof ApiError);
        assert.strictEqual(result.error.statusCode, 500);
        assert.strictEqual(result.error.message, 'Connection timeout');
    });

    test('should handle complex async operations', async () => {
        const boundary = createAsyncErrorBoundary(err => new Error(`Caught: ${err}`));

        const result = await boundary(async () => {
            const values = await Promise.all([
                Promise.resolve(1),
                Promise.resolve(2),
                Promise.resolve(3)
            ]);
            return values.reduce((sum, val) => sum + val, 0);
        });

        assert.strictEqual(isSuccess(result), true);
        assert.strictEqual(result.data, 6);
    });
});