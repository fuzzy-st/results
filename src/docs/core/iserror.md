# `isError` Function Guide

The `isError` function is a **type guard** utility in the Result pattern that checks whether a given result is an error result.

## Why Use `isError`?

Type guards provide a safe and type-aware way to check result states:
- Runtime type checking
- Type narrowing
- Explicit error state detection
- Improved type safety

### Key Benefits
- Precise error state identification
- Type inference support
- Reduces type casting
- Improves code readability

## Usage Examples


We have a complementary set of detailed [examples](../../examples/core/isTypeguards.ts) that you can view further on how to utilize `isError()` method

### Basic Type Checking

```typescript
const result = fetchData(); // Result<User, Error>

if (isError(result)) {
    // TypeScript knows result is an error result
    console.error(result.error.message);
} else {
    // TypeScript knows result is a success result
    console.log(result.data);
}
```

### Filtering Results

```typescript
const results: Result<number, Error>[] = [
    success(1),
    error(new Error('First error')),
    success(2),
    error(new Error('Second error'))
];

// Filter out error results
const errorResults = results.filter(isError);
errorResults.forEach(err => {
    console.log(err.error.message);
});
```

### Advanced Type Narrowing

```typescript
function handleResult(result: Result<User, Error>) {
    if (isError(result)) {
        // Type is narrowed to error result
        switch (result.error.name) {
            case 'ValidationError':
                handleValidationError(result.error);
                break;
            case 'NetworkError':
                handleNetworkError(result.error);
                break;
            default:
                handleGenericError(result.error);
        }
    } else {
        // Type is narrowed to success result
        processUser(result.data);
    }
}
```

## API Reference

### Function Signature
```typescript
function isError(result: unknown): result is Result<unknown, unknown>
```

### Parameters
- `result`: Any value to check
  - Typically a Result object
  - Works with unknown types

### Returns
- `true` if the result is an error result
- `false` otherwise
- Type predicate for TypeScript type narrowing

## Best Practices
- Use for explicit error state checking
- Combine with other type guards
- Avoid complex logic within checks
- Prefer pattern matching for complex scenarios

## Common Pitfalls
- Don't overuse type guards
- Be aware of runtime vs. compile-time checks
- Ensure comprehensive error handling

## Advanced Usage

### Custom Error Discrimination

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
    if (isError(result)) {
        const error = result.error;
        
        if (error instanceof ValidationError) {
            handleValidationError(error);
        } else if (error instanceof NetworkError) {
            handleNetworkError(error);
        }
    }
}
```

### Conditional Processing

```typescript
function processResults(results: Result<number, Error>[]) {
    const processedResults = results.map(result => 
        isError(result) 
            ? { status: 'failed', error: result.error }
            : { status: 'success', value: result.data * 2 }
    );
}
```

## Type Guard Patterns

### Safe Unwrapping

```typescript
function safeUnwrap<T>(result: Result<T, Error>): T | null {
    return isError(result) ? null : result.data;
}
```

### Error Collection

```typescript
function collectErrors<T>(results: Result<T, Error>[]): Error[] {
    return results
        .filter(isError)
        .map(result => result.error);
}
```


## Related Methods
- `isSuccess()`: Checks for successful results
- `isResult()`: Checks if a value is a Result
- `match()`: Pattern matching for results
- `error()`: Creates an error result

## Performance Considerations
- Near-zero runtime overhead
- Compile-time type inference


## When to Use vs Alternatives

- Use `isError()` when:
  - You need runtime type checking
  - Want type narrowing
  - Performing simple error state checks

- Use `match()` when:
  - Need complex result processing
  - Want to handle both success and error cases

- Use `unwrap()` when:
  - You're absolutely certain the result will be successful
  - Want to extract the value directly
  - Prefer immediate error propagation
  - Working in contexts with guaranteed successful results