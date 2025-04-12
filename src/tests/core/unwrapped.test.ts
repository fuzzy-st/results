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
        const numberSuccessResult = success(42);
        assert.strictEqual(unwrapOr(numberSuccessResult, 0), 42);
        const numberErrorResult = error(new Error('Number error'));
        assert.strictEqual(unwrapOr(numberErrorResult, 0), 0);

        // String
        const stringSuccessResult = success('hello');
        assert.strictEqual(unwrapOr(stringSuccessResult, 'default'), 'hello');
        const stringErrorResult = error(new Error('String error'));
        assert.strictEqual(unwrapOr(stringErrorResult, 'default'), 'default');

        // Object
        const defaultUser = { id: 0, name: 'Guest' };
        const userSuccessResult = success({ id: 1, name: 'John' });
        assert.deepStrictEqual(unwrapOr(userSuccessResult, defaultUser), { id: 1, name: 'John' });
        const userErrorResult = error(new Error('User error'));
        assert.deepStrictEqual(unwrapOr(userErrorResult, defaultUser), defaultUser);

        // Null
        const nullResult = success(null);
        assert.strictEqual(unwrapOr(nullResult, {}), null);

        // Error
        const errorResult = error(new Error('Something went wrong'));
        assert.strictEqual(unwrapOr(errorResult, 'default'), 'default');
        assert.strictEqual(unwrapOr(errorResult, undefined), undefined);
        assert.strictEqual(unwrapOr(errorResult, false), false);
        assert.strictEqual(unwrapOr(errorResult, 0), 0);

        // Undefined
        const undefinedResult = success(undefined);
        assert.strictEqual(unwrapOr(undefinedResult, 'default'), undefined);

    });

    test('should work with lazy evaluation of default value', () => {
        // Default value as a function
        const errorResult = error(new Error('Computation error'));

        const defaultValueFn = () => {
            // Simulate some computation
            return 42;
        };

        assert.strictEqual(unwrapOr(errorResult, defaultValueFn()), 42);
    });

    test('should preserve type when using default value', () => {
        interface User {
            id: number;
            name: string;
        }

        const defaultUser: User = { id: 0, name: 'Guest' };

        // Success case
        const successResult = success<User>({ id: 1, name: 'John' });
        const successValue = unwrapOr(successResult, defaultUser);
        assert.deepStrictEqual(successValue, { id: 1, name: 'John' });

        // Error case
        const errorResult = error<User, Error>(new Error('User not found'));
        const errorValue = unwrapOr(errorResult, defaultUser);
        assert.deepStrictEqual(errorValue, defaultUser);
    });
})
