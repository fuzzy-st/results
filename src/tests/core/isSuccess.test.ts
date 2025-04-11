import assert from 'node:assert';
import test, { describe } from 'node:test';
import { isSuccess } from '~/lib/core/isSuccess';
import { success } from '~/lib/core/success';
import { error } from '~/lib/core/error';

describe('(CORE) `isSuccess` function', () => {

    test('should correctly identify successful results', () => {
        const successResult = success(42);
        assert.strictEqual(isSuccess(successResult), true);
    });

    test('should return false for error results', () => {
        const errorResult = error(new Error('Something went wrong'));
        assert.strictEqual(isSuccess(errorResult), false);
    });

    test('should work with various data types', () => {
        const numberResult = success(42);
        const stringResult = success('hello');
        const objectResult = success({ key: 'value' });
        const nullResult = success(null);

        assert.strictEqual(isSuccess(numberResult), true);
        assert.strictEqual(isSuccess(stringResult), true);
        assert.strictEqual(isSuccess(objectResult), true);
        assert.strictEqual(isSuccess(nullResult), true);
    });

    test('should return false for non-result objects', () => {
        //@ts-ignore
        assert.strictEqual(isSuccess(42), false);
        //@ts-ignore
        assert.strictEqual(isSuccess(null), false);
        //@ts-ignore
        assert.strictEqual(isSuccess(undefined), false);
        //@ts-ignore
        assert.strictEqual(isSuccess({}), false);
        //@ts-ignore
        assert.strictEqual(isSuccess({ status: 'something' }), false);
    });

    test('should work with type narrowing', () => {
        const result = Math.random() > 0.5
            ? success(42)
            : error(new Error('Random error'));

        if (isSuccess(result)) {
            // Type should be narrowed to success result
            assert.ok(result.data !== undefined);
        } else {
            // Type should be narrowed to error result
            assert.ok(result.error !== undefined);
        }
    });

    test('should handle edge cases', () => {
        // Success with falsy values
        const zeroResult = success(0);
        const emptyStringResult = success('');
        const falseResult = success(false);

        assert.strictEqual(isSuccess(zeroResult), true);
        assert.strictEqual(isSuccess(emptyStringResult), true);
        assert.strictEqual(isSuccess(falseResult), true);
    });
})
