import assert from 'node:assert';
import test, { describe } from 'node:test';
import { unwrap } from '~/lib/core/unwrap';
import { unwrapOr } from '~/lib/core/unwrapOr';
import { success } from '~/lib/core/success';
import { error } from '~/lib/core/error';

describe('(CORE) `unwrap` function', () => {
    test('should extract value from successful results', () => {
        const successResult = success(42);
        assert.strictEqual(unwrap(successResult), 42);
    });

    test('should throw an error when unwrapping an error result', () => {
        const errorResult = error(new Error('Something went wrong'));
        assert.throws(() => unwrap(errorResult), /Something went wrong/);
    });

    test('should work with different data types', () => {
        // Number
        const numberResult = success(42);
        assert.strictEqual(unwrap(numberResult), 42);

        // String
        const stringResult = success('hello');
        assert.strictEqual(unwrap(stringResult), 'hello');

        // Object
        const objectResult = success({ name: 'John', age: 30 });
        assert.deepStrictEqual(unwrap(objectResult), { name: 'John', age: 30 });

        // Null
        const nullResult = success(null);
        assert.strictEqual(unwrap(nullResult), null);
    });

    test('should preserve the original error when throwing', () => {
        class CustomError extends Error {
            constructor(message: string) {
                super(message);
                this.name = 'CustomError';
            }
        }

        const errorResult = error(new CustomError('Custom error'));

        try {
            unwrap(errorResult);
        } catch (err) {
            assert(err instanceof CustomError);
            assert.strictEqual(err.message, 'Custom error');
            assert.strictEqual(err.name, 'CustomError');
        }
    });
})

describe('(CORE) `unwrapOr function', () => {
    test('should extract value from successful results', () => {
        const successResult = success(42);
        assert.strictEqual(unwrapOr(successResult, 0), 42);
    });

    test('should return the default value when unwrapping an error result', () => {
        const errorResult = error(new Error('Something went wrong'));
        assert.strictEqual(unwrapOr(errorResult, 0), 0);
    });

    test('should work with different data types', () => {
        // Number
        const numberResult = success(42);
        assert.strictEqual(unwrapOr(numberResult, 0), 42);

        // String
        const stringResult = success('hello');
        assert.strictEqual(unwrapOr(stringResult, 'default'), 'hello');

        // Object
        const objectResult = success({ name: 'John', age: 30 });
        //@ts-ignore
        assert.deepStrictEqual(unwrapOr(objectResult, {}), { name: 'John', age: 30 });

        // Null
        const nullResult = success(null);
        assert.strictEqual(unwrapOr(nullResult, {}), null);
    });

    test('should return the default value when unwrapping an error result with a different type', () => {
        const errorResult = error(new Error('Something went wrong'));
        assert.strictEqual(unwrapOr(errorResult, 'default'), 'default');
    });
    test('should return the default value when unwrapping an error result with a null value', () => {
        const errorResult = error(new Error('Something went wrong'));
        assert.strictEqual(unwrapOr(errorResult, null), null);
    }
    );
    test('should return the default value when unwrapping an error result with an undefined value', () => {
        const errorResult = error(new Error('Something went wrong'));
        assert.strictEqual(unwrapOr(errorResult, undefined), undefined);
    }
    );
    test('should return the default value when unwrapping an error result with a boolean value', () => {
        const errorResult = error(new Error('Something went wrong'));
        assert.strictEqual(unwrapOr(errorResult, false), false);
    }
    );
    test('should return the default value when unwrapping an error result with a number value', () => {
        const errorResult = error(new Error('Something went wrong'));
        assert.strictEqual(unwrapOr(errorResult, 0), 0);
    }
    );
})