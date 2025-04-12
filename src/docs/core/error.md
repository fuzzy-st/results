# `error` Function Guide

The `error` function is a **core** utility in the Result pattern that creates a strongly typed error result. Wrapping any error value into a standardized error object.

## Why Use `error`?

In many types of applications, error handling can become verbose and inconsistent, often leading to antipatterns or often neglecting to handle `Error`'s properly as they arise. 

This `error` function seeks to provide the following:
- Consistent error representation by standardizing the error result structure across the codebase
- Type-safe error wrapping and handling
- Facilitates functional error management
- Easy error creation across different contexts and works seemlessly with various error types

## Usage Examples

We have a complementary set of detailed [examples](../../examples/core/errors.ts) that you can view further on how to utilize `error()` method 

### Basic Error Creation

```typescript
// Create an error with a standard Error
const standardError = error(new Error('Something went wrong'));

// Create an error with a custom error type
class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}
const customError = error(new ValidationError('Invalid input'));

// Create an error with a primitive value
const primitiveError = error('Connection failed');
```

### Validation Scenario

```typescript
function validateEmail(email: string): Result<string, Error> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        return error(new Error('Email cannot be empty'));
    }

    if (!emailRegex.test(email)) {
        return error(new Error('Invalid email format'));
    }

    return success(email);
}

// Usage
const invalidEmail = validateEmail('invalid-email');
// Result: { status: 'error', error: Error('Invalid email format') }
```

### Complex Error Objects

```typescript
interface DatabaseError extends Error {
    code: number;
    context?: Record<string, unknown>;
}

function performDatabaseOperation(data: unknown): Result<unknown, DatabaseError> {
    if (!data) {
        return error({
            name: 'DatabaseError',
            message: 'Empty data provided',
            code: 400,
            context: {
                timestamp: new Date(),
                operation: 'insert'
            }
        } as DatabaseError);
    }

    return success(data);
}
```

## API Reference

### Function Signature
```typescript
function error<E = Error>(error: E): Result<never, E>
```

### Parameters
- `error`: The error to be wrapped
  - Can be any type of error (standard Error, custom Error, primitive)
  - Defaults to Error type if not specified

### Returns
- A Result object with:
  - `status`: Always set to `'error'`
  - `error`: The provided error value

## Best Practices
- Use meaningful error messages 
    - if you are reading this then checkout `@fuzzy-street/errors` 🤫
- Create custom error types for specific scenarios
- Include additional context when possible
- Avoid wrapping already wrapped errors

## Common Pitfalls
- Don't use `error()` for successful operations !!!
- Ensure error objects provide sufficient context
- Be consistent with error type usage

## TypeScript Considerations
- Leverages TypeScript's generics for type safety
- Allows custom error types
- Provides type narrowing capabilities

## Related Methods
- `success()`: Creates a successful result
- `match()`: Pattern matching for results
- `isError()`: Type guard to check for error results

## Performance Considerations
- Lightweight operation
- Minimal runtime overhead
- Zero-cost abstraction in most cases
