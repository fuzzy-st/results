# `match` Function Guide

The `match` function is a powerful **core** utility in the Result pattern that provides pattern matching for handling different result states with type-safe callbacks.

## Why Use `match`?

Pattern matching solves several critical challenges in error handling:
- Explicit handling of success and error cases
- Type-safe result processing
- Eliminates nested conditionals
- Provides a functional approach to result management

### Key Benefits
- Comprehensive result handling
- Type inference for callbacks
- Reduces complexity of error checking
- Encourages explicit error management

## Usage Examples

We have a complementary set of detailed [examples](../../examples/core/match.ts) that you can view further on how to utilize `match()` method

### Basic Result Matching

```typescript
const result = fetchData(); // Returns Result<User, Error>

const output = match(result, {
    success: (user) => `User found: ${user.name}`,
    error: (err) => `Error: ${err.message}`
});
```

### Validation Scenario

```typescript
function validateUser(user: unknown): Result<User, Error> {
    // Validation logic
}

const result = validateUser(inputData);

const processedUser = match(result, {
    success: (user) => {
        // Process valid user
        return createUserProfile(user);
    },
    error: (err) => {
        // Log or handle validation error
        logValidationError(err);
        return createGuestProfile();
    }
});
```

### Async Operations

```typescript
async function fetchUserData(id: number): Promise<Result<User, Error>> {
    // Async data fetching
}

const userResult = await fetchUserData(42);

const userDisplay = match(userResult, {
    success: async (user) => {
        const additionalData = await fetchAdditionalUserData(user.id);
        return renderUserProfile(user, additionalData);
    },
    error: (err) => renderErrorMessage(err)
});
```

## API Reference

### Function Signature
```typescript
function match<T, E, R>(
    result: Result<T, E>, 
    handlers: {
        success: (value: T) => R;
        error: (error: E) => R;
    }
): R
```

### Parameters
- `result`: The Result to match against
- `handlers`: An object with two methods:
  - `success`: Callback for successful results
  - `error`: Callback for error results

### Returns
- The result of calling the appropriate handler

## Best Practices
- Always handle both success and error cases
- Keep handler logic concise
- Use for transforming results
- Leverage type inference

## Common Pitfalls
- Avoid complex logic in handlers
- Ensure consistent return types
- Don't ignore error cases

## TypeScript Considerations
- Provides strong type inference
- Ensures exhaustive handling
- Supports generics for flexible typing

## Advanced Matching Techniques

### Complex Type Handling

```typescript
type FetchResult = Result<User | null, NetworkError>;

const userStatus = match(result, {
    success: (user) => user 
        ? `Active user: ${user.name}` 
        : 'No user found',
    error: (err) => `Network error: ${err.code}`
});
```

### Error Discrimination

```typescript
class ValidationError extends Error {
    constructor(public field: string, message: string) {
        super(message);
    }
}

class NetworkError extends Error {
    constructor(public code: number) {
        super('Network error');
    }
}

function handleResult(result: Result<Data, ValidationError | NetworkError>) {
    return match(result, {
        success: (data) => processData(data),
        error: (err) => {
            if (err instanceof ValidationError) {
                return handleValidationError(err);
            }
            if (err instanceof NetworkError) {
                return handleNetworkError(err);
            }
        }
    });
}
```

## Related Methods
- `success()`: Creates a successful result
- `error()`: Creates an error result
- `unwrap()`: Extracts value from results
- `isSuccess()`: Checks if a result is successful

## Performance Considerations
- Minimal runtime overhead
- Inlined by modern JavaScript engines
- Zero-cost abstraction in most cases

## Error Handling Patterns

### Fallback Values

```typescript
const safeResult = match(riskyOperation(), {
    success: (value) => value,
    error: () => defaultValue
});
```

### Logging and Reporting

```typescript
match(apiCall(), {
    success: (data) => updateUI(data),
    error: (err) => {
        logError(err);
        reportToMonitoring(err);
        showUserFriendlyError();
    }
});
```
