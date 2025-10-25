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
    test('should handle discriminated union of success types', () => {
        function getResult(amount: number) {
            if (amount > 100) {
                return success({ type: 'high' as const, value: amount });
            }
            if (amount > 50) {
                return success({ type: 'medium' as const, value: amount });
            }
            if (amount > 0) {
                return success({ type: 'low' as const, value: amount });
            }
            return error(new Error('Amount must be positive'));
        }

        // Test high case
        const highResult = getResult(150);
        assert.strictEqual(isSuccess(highResult), true);
        if (isSuccess(highResult)) {
            // TypeScript should properly narrow to the union
            assert.strictEqual(highResult.data.type, 'high');
            assert.strictEqual(highResult.data.value, 150);
        }

        // Test medium case
        const mediumResult = getResult(75);
        assert.strictEqual(isSuccess(mediumResult), true);
        if (isSuccess(mediumResult)) {
            assert.strictEqual(mediumResult.data.type, 'medium');
            assert.strictEqual(mediumResult.data.value, 75);
        }

        // Test low case
        const lowResult = getResult(25);
        assert.strictEqual(isSuccess(lowResult), true);
        if (isSuccess(lowResult)) {
            assert.strictEqual(lowResult.data.type, 'low');
            assert.strictEqual(lowResult.data.value, 25);
        }

        // Test error case
        const errorResult = getResult(-5);
        assert.strictEqual(isSuccess(errorResult), false);
    });

    test('should handle union of different success data structures', () => {
        type UserResponse = { kind: 'user'; id: number; name: string };
        type AdminResponse = { kind: 'admin'; id: number; name: string; permissions: string[] };
        type GuestResponse = { kind: 'guest'; sessionId: string };

        function authenticate(role: 'user' | 'admin' | 'guest' | 'invalid') {
            switch (role) {
                case 'user':
                    return success<UserResponse>({ kind: 'user', id: 1, name: 'John' });
                case 'admin':
                    return success<AdminResponse>({
                        kind: 'admin',
                        id: 2,
                        name: 'Admin',
                        permissions: ['read', 'write']
                    });
                case 'guest':
                    return success<GuestResponse>({ kind: 'guest', sessionId: 'abc123' });
                case 'invalid':
                    return error(new Error('Invalid role'));
            }
        }

        const userResult = authenticate('user');
        if (isSuccess(userResult)) {
            if (userResult.data.kind === 'user') {
                assert.strictEqual(userResult.data.id, 1);
                assert.strictEqual(userResult.data.name, 'John');
            }
        }

        const adminResult = authenticate('admin');
        if (isSuccess(adminResult)) {
            if (adminResult.data.kind === 'admin') {
                assert.strictEqual(adminResult.data.id, 2);
                assert.deepStrictEqual(adminResult.data.permissions, ['read', 'write']);
            }
        }

        const guestResult = authenticate('guest');
        if (isSuccess(guestResult)) {
            if (guestResult.data.kind === 'guest') {
                assert.strictEqual(guestResult.data.sessionId, 'abc123');
            }
        }
    });

    test('should handle union of primitive and complex success types', () => {
        function getResult(type: 'string' | 'number' | 'object' | 'array' | 'error') {
            switch (type) {
                case 'string':
                    return success('Hello');
                case 'number':
                    return success(42);
                case 'object':
                    return success({ key: 'value', count: 10 });
                case 'array':
                    return success([1, 2, 3, 4, 5]);
                case 'error':
                    return error(new Error('Failed'));
            }
        }

        const stringResult = getResult('string');
        if (isSuccess(stringResult)) {
            assert.strictEqual(typeof stringResult.data, 'string');
            assert.strictEqual(stringResult.data, 'Hello');
        }

        const numberResult = getResult('number');
        if (isSuccess(numberResult)) {
            assert.strictEqual(typeof numberResult.data, 'number');
            assert.strictEqual(numberResult.data, 42);
        }

        const objectResult = getResult('object');
        if (isSuccess(objectResult)) {
            assert.strictEqual(typeof objectResult.data, 'object');
            assert.deepStrictEqual(objectResult.data, { key: 'value', count: 10 });
        }

        const arrayResult = getResult('array');
        if (isSuccess(arrayResult)) {
            assert.strictEqual(Array.isArray(arrayResult.data), true);
            assert.deepStrictEqual(arrayResult.data, [1, 2, 3, 4, 5]);
        }
    });
})
