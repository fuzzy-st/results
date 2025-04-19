import assert from 'node:assert';
import test, { describe } from 'node:test';
import { asyncMapError } from '~/lib/async/asyncMapError';
import { success } from '~/lib/core/success';
import { error } from '~/lib/core/error';
import { isSuccess } from '~/lib/core/isSuccess';
import { isError } from '~/lib/core/isError';

describe('(ASYNC) `asyncMapError` function', () => {
    test('should transform error result with async function', async () => {
        const errorResult = error(new Error('Original error'));
        const asyncTransform = async (err: Error) => new Error(`Transformed: ${err.message}`);

        const mappedResult = await asyncMapError(errorResult, asyncTransform);

        assert.strictEqual(isError(mappedResult), true);
        assert.strictEqual(mappedResult.status, 'error');
        assert.strictEqual(mappedResult.error.message, 'Transformed: Original error');
    });

    test('should pass through success results unchanged', async () => {
        const successValue = { id: 1, name: 'Test' };
        const successResult = success(successValue);
        const asyncTransform = async (err: Error) => new Error(`Transformed: ${err.message}`);

        const mappedResult = await asyncMapError(successResult, asyncTransform);

        assert.strictEqual(isSuccess(mappedResult), true);
        assert.strictEqual(mappedResult.status, 'success');
        assert.strictEqual(mappedResult.data, successValue);
    });

    test('should convert thrown errors in async function to error results', async () => {
        const errorResult = error(new Error('Original error'));
        const asyncThrowingTransform = async () => {
            throw new Error('Transform error');
        };

        const mappedResult = await asyncMapError(errorResult, asyncThrowingTransform);

        assert.strictEqual(isError(mappedResult), true);
        assert.strictEqual(mappedResult.status, 'error');
        assert.strictEqual(mappedResult.error.message, 'Transform error');
    });

    test('should handle custom error types', async () => {
        class ApiError extends Error {
            constructor(public code: number, message: string) {
                super(message);
                this.name = 'ApiError';
            }
        }

        class DisplayError extends Error {
            constructor(public userMessage: string, public originalError?: Error) {
                super(userMessage);
                this.name = 'DisplayError';
            }
        }

        const apiError = new ApiError(404, 'Not found');
        const errorResult = error(apiError);

        const asyncTransform = async (err: ApiError) => {
            // Simulate async operation like fetching error messages from a database
            await new Promise(resolve => setTimeout(resolve, 10));

            return new DisplayError(
                err.code === 404 ? 'The requested resource could not be found' : 'An error occurred',
                err
            );
        };

        const mappedResult = await asyncMapError(errorResult, asyncTransform);

        assert.strictEqual(isError(mappedResult), true);
        assert.ok(mappedResult.error instanceof DisplayError);
        assert.strictEqual(mappedResult.error.userMessage, 'The requested resource could not be found');
        assert.strictEqual(mappedResult.error.originalError, apiError);
    });

    test('should handle primitive error types', async () => {
        // String error
        const stringErrorResult = error('Invalid input');
        const stringTransform = async (err: string) => `User error: ${err}`;

        const stringMappedResult = await asyncMapError(stringErrorResult, stringTransform);
        assert.strictEqual(isError(stringMappedResult), true);
        assert.strictEqual(stringMappedResult.error, 'User error: Invalid input');

        // Number error
        const numberErrorResult = error(404);
        const numberTransform = async (code: number) => `HTTP error ${code}`;

        const numberMappedResult = await asyncMapError(numberErrorResult, numberTransform);
        assert.strictEqual(isError(numberMappedResult), true);
        assert.strictEqual(numberMappedResult.error, 'HTTP error 404');

        // Object error
        const objErrorResult = error({ code: 500, message: 'Server error' });
        const objTransform = async (err: { code: number, message: string }) =>
            `Error ${err.code}: ${err.message}`;

        const objMappedResult = await asyncMapError(objErrorResult, objTransform);
        assert.strictEqual(isError(objMappedResult), true);
        assert.strictEqual(objMappedResult.error, 'Error 500: Server error');
    });

    test('should handle rejected promises in async function', async () => {
        const errorResult = error(new Error('Original error'));

        const asyncRejectingTransform = async () => {
            return Promise.reject(new Error('Promise rejected'));
        };

        const mappedResult = await asyncMapError(errorResult, asyncRejectingTransform);

        assert.strictEqual(isError(mappedResult), true);
        assert.strictEqual(mappedResult.error.message, 'Promise rejected');
    });

    test('should convert non-Error exceptions to Error objects', async () => {
        const errorResult = error('original');

        // String rejection
        const stringRejectTransform = async () => {
            return Promise.reject('String error');
        };

        const stringResult = await asyncMapError(errorResult, stringRejectTransform);
        assert.strictEqual(isError(stringResult), true);
        assert.ok(stringResult.error instanceof Error);
        assert.strictEqual(stringResult.error.message, 'String error');

        // Object rejection
        const objectRejectTransform = async () => {
            return Promise.reject({ code: 404, message: 'Not found' });
        };

        const objectResult = await asyncMapError(errorResult, objectRejectTransform);
        assert.strictEqual(isError(objectResult), true);
        assert.ok(objectResult.error instanceof Error);
        assert.ok(objectResult.error.message.includes('[object Object]'));
    });
});