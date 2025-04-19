# `tapSuccess` Function Guide

The `tapSuccess` function is a **transformer** utility in the Result pattern that allows you to perform side effects only on successful Results without modifying them, providing a focused way to handle success cases.

## Why Use `tapSuccess`?

While the general `tap` function works with any Result, `tapSuccess` specifically targets successful Results:
- Only execute code for success cases
- Cleaner than checking status inside a general tap
- Directly access the success value
- Skip unnecessary error handling 
- Perfect for success-specific operations

### Key Benefits
- Focused handling of successful Results
- Direct access to success data
- No status checking boilerplate 
- Skip processing for error Results
- Maintain original Result reference

## Usage Examples

We have a complementary set of detailed [examples](../../examples/transformers/tapSuccess.ts) that you can view further on how to utilize the `tapSuccess()` method

### Basic Success Handling

```typescript
const result = success(42);

// Process only successful results
const tappedResult = tapSuccess(result, value => {
    console.log(`Processing successful value: ${value}`);
    // Direct access to the value, no need to check status
});

// Error results are simply passed through
const errorResult = error(new Error("Failed"));
tapSuccess(errorResult, value => {
    // This function will not be called
    console.log("This won't run");
});
```

### Collecting Success Values

```typescript
const results = [
    success(10),
    error(new Error("Failed")),
    success(20),
    success(30)
];

const successValues = [];

// Collect only successful values
results.forEach(result => {
    tapSuccess(result, value => {
        successValues.push(value);
    });
});

console.log(successValues); // [10, 20, 30]
```

### Data Analytics

```typescript
function processWithAnalytics(data: Result<number[], Error>) {
    return tapSuccess(data, values => {
        // Calculate analytics only for successful results
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;
        
        analytics.record({
            count: values.length,
            sum,
            average: avg,
            min: Math.min(...values),
            max: Math.max(...values)
        });
    });
}
```

## API Reference

### Function Signature
```typescript
function tapSuccess<T, E>(
    result: Result<T, E>,
    fn: (data: T) => void
): Result<T, E>
```

### Parameters
- `result`: The Result to tap into
- `fn`: Side effect function to execute on success
  - Takes only the success value as its argument
  - Should not return anything
  - Only called for success results

### Returns
- The original Result object, unchanged

## Best Practices
- Use for success-specific side effects
- Keep functions simple and focused
- Avoid modifying external state when possible
- Use for logging, metrics, and diagnostics
- Use for caching successful results

## Common Pitfalls
- Remember it only runs for success Results
- Don't throw exceptions from tap functions
- Don't rely on it for transformations
- Not meant for error handling

## TypeScript Considerations
- Direct access to typed success value
- No handling needed for error case
- Preserves the original Result reference

## Advanced Usage

### Caching Successful Results

```typescript
function withCache<T, E>(key: string, result: Result<T, E>): Result<T, E> {
    return tapSuccess(result, data => {
        cache.set(key, data);
    });
}

// Use in operations
const userResult = withCache('user:123', fetchUser(123));
```

### Notifications for Success

```typescript
function withNotification<T>(
    result: Result<T, Error>,
    message: string
): Result<T, Error> {
    return tapSuccess(result, () => {
        notify({
            type: 'success',
            message,
            timestamp: new Date()
        });
    });
}
```

## Related Methods
- `tap()`: Tap into any Result
- `tapError()`: Tap only into error Results
- `map()`: Transform success values
- `chain()`: Transform with operations that might fail

## Performance Considerations
- Only executes function for success Results
- No object creation (returns original object)
- More efficient than general tap with conditional

## Functional Patterns

### Auditing

```typescript
function audit<T>(
    operation: string,
    result: Result<T, Error>
): Result<T, Error> {
    return tapSuccess(result, data => {
        auditLog.push({
            operation,
            result: 'success',
            timestamp: new Date(),
            data
        });
    });
}
```

### Metrics Collection

```typescript
function trackSuccess<T>(
    operation: string,
    startTime: number,
    result: Result<T, Error>
): Result<T, Error> {
    return tapSuccess(result, () => {
        const duration = Date.now() - startTime;
        metrics.recordSuccess(operation, duration);
    });
}
```

## When to Use vs Alternatives

- Use `tapSuccess()` when:
  - You only need to perform actions for successful Results
  - Want direct access to the success value
  - Working with success-specific operations
  - Collecting success data

- Use `tap()` when:
  - You need to work with both success and error cases
  - Want to handle the entire Result

- Use `tapError()` when:
  - You only need to perform actions for error Results