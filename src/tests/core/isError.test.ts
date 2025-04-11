import assert from 'node:assert';
import test, { describe } from 'node:test';
import { isError } from '~/lib/core/isError';
import { success } from '~/lib/core/success';
import { error } from '~/lib/core/error';

describe('(CORE) `isError` function', () => {
    test('it should correctly identify error results', () => {
        const errorResult = error(new Error('Something went wrong'));
        assert.strictEqual(isError(errorResult), true);
    });

    test('it should return false for "successful" results', () => {
        const successResult = success(42);
        assert.strictEqual(isError(successResult), false);
    });

    test('it should handle various error types', () => {
        // Standard Error
        const standardError = error(new Error('Standard error'));
        assert.strictEqual(isError(standardError), true);

        // Custom Error
        class CustomError extends Error {
            constructor(message: string) {
                super(message);
                this.name = 'CustomError';
            }
        }
        const customError = error(new CustomError('Custom error'));
        assert.strictEqual(isError(customError), true);

        // Primitive error
        const primitiveError = error('Primitive error');
        assert.strictEqual(isError(primitiveError), true);
    });

    test('it should return false for invalid Result objects', () => {
        const invalidResults = [
            { status: 'unknown' }, // Invalid status
            { status: 'success' }, // Missing data
            { status: 'error' },   // Missing error
            { status: 'success', data: undefined }, // Invalid data
            { status: 'error', error: undefined }   // Invalid error
        ];
        invalidResults.forEach(result => {
            //@ts-ignore
            assert.strictEqual(isError(result), false);
        });
        //@ts-ignore
        assert.strictEqual(isError({}), false); // Empty object
        //@ts-ignore
        assert.strictEqual(isError(null), false); // Null value
        //@ts-ignore
        assert.strictEqual(isError(undefined), false); // Undefined value
        //@ts-ignore
        assert.strictEqual(isError(42), false); // Primitive value
        //@ts-ignore
        assert.strictEqual(isError('error'), false); // String value
        //@ts-ignore
        assert.strictEqual(isError(true), false); // Boolean value
        //@ts-ignore
        assert.strictEqual(isError([]), false); // Array
        //@ts-ignore
        assert.strictEqual(isError({ status: 'error', error: null }), false); // Null error
        //@ts-ignore
        assert.strictEqual(isError({ status: 'error', data: null }), false); // Null data
    });

    test('it should work with type narrowing', () => {
        const result = Math.random() > 0.5
            ? success(42)
            : error(new Error('Random error'));

        if (isError(result)) {
            // Type should be narrowed to error result
            assert.ok(result.error);
        } else {
            // Type should be narrowed to success result
            assert.ok(result.data);
        }
    });
})
