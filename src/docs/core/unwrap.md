# `unwrap` Function Guide

The `unwrap` function is a **core** utility in the Result pattern that extracts the value from a successful result, throwing an error if the result is unsuccessful.

## Why Use `unwrap`?

In scenarios where you expect a successful result and want to immediately access its value, `unwrap` provides:
- Direct value extraction
- Immediate error propagation
- Simplified error handling
- Fail-fast mechanism

### Key Benefits
- Simplifies value retrieval
- Enforces error handling
- Provides clear intent
- Reduces boilerplate code

## Usage Examples

We have a complementary set of detailed [examples](../../examples/core/unwraps.ts) that you can view further on how to utilize `unwrap()` method

### Basic Unwrapping

```typescript
// Successful result
const successResult = success(42);
const value = unwrap(successResult); // Returns 42

// Error result
const errorResult = error(new Error('Something went wrong'));
try {
    const value = unwrap(errorResult); // Throws the error
} catch (err) {
    console.error(err.message); // 'Something went wrong'
}
```

### Validation Scenario

```typescript
function processUserInput(input: string): Result<number, Error> {
    const parsed = parseInt(input, 10);
    return isNaN(parsed) 
        ? error(new Error('Invalid number'))
        : success(parsed);
}

function calculateSquare(input: string) {
    try {
        const number = unwrap(processUserInput(input));
        return number * number;
    } catch (err) {
        console.error('Calculation failed:', err.message);
        return 0;
    }
}

calculateSquare('5');   // Returns 25
calculateSquare('abc'); // Logs error, returns 0
```

### Async Operations

```typescript
async function fetchUserData(id: number): Promise<Result<User, Error>> {
    // Simulated async operation
    const result = await userService.fetchById(id);
    return result;
}

async function processUser(id: number) {
    try {
        // Directly unwrap the successful result
        const user = unwrap(await fetchUserData(id));
        return createUserProfile(user);
    } catch (err) {
        // Handle any errors from the fetch or unwrap
        logError(err);
        return createGuestProfile();
    }
}
```

## API Reference

### Function Signature
```typescript
function unwrap<T, E = Error>(result: Result<T, E>): T
```

### Parameters
- `result`: The Result to unwrap
  - Must be a successful result to extract the value

### Returns
- The inner value of a successful result

### Throws
- Throws the error if the result is unsuccessful

## Best Practices
- Use in contexts where you expect success
- Always have error handling
- Prefer `unwrapOr` for fallback scenarios
- Use with try-catch for robust error management

## Common Pitfalls
- Don't use without error handling
- Avoid in performance-critical paths
- Not suitable for uncertain results

## TypeScript Considerations
- Preserves original value type
- Provides type-safe extraction
- Works with generic Result types

## Advanced Usage

### Custom Error Handling

```typescript
class ValidationError extends Error {
    constructor(message: string, public field: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

function strictValidation(input: unknown): Result<string, ValidationError> {
    if (typeof input !== 'string') {
        return error(new ValidationError(
            'Invalid input type', 
            'input'
        ));
    }
    return success(input);
}

function processInput(input: unknown) {
    try {
        const validInput = unwrap(strictValidation(input));
        return processValidInput(validInput);
    } catch (err) {
        if (err instanceof ValidationError) {
            // Special handling for validation errors
            handleValidationError(err);
        } else {
            // Generic error handling
            handleGenericError(err);
        }
    }
}
```

## Related Methods
- `unwrapOr()`: Provides a default value if unwrapping fails
- `match()`: Pattern matching for results
- `success()`: Creates a successful result
- `error()`: Creates an error result

## Performance Considerations
- Lightweight operation
- Minimal runtime overhead
- Should be used judiciously
- Potential performance impact if overused in tight loops

## Error Handling Patterns

### Fallback Mechanism

```typescript
function safeUnwrap<T>(result: Result<T, Error>, fallback: T): T {
    try {
        return unwrap(result);
    } catch {
        return fallback;
    }
}
```

### Logging Wrapper

```typescript
function loggedUnwrap<T>(result: Result<T, Error>): T {
    try {
        return unwrap(result);
    } catch (err) {
        console.error('Unwrap failed:', err);
        throw err;
    }
}
```

## When to Use vs Alternatives

- Use `unwrap()` when:
  - You're certain the result is successful
  - Immediate error propagation is desired
  - You want to fail fast

- Use `unwrapOr()` when:
  - You need a default value
  - The operation might fail
  - You want to provide a fallback

- Use `match()` when:
  - You need to handle both success and error cases
  - More complex processing is required
