# `tapError` Function Guide

The `tapError` function is a **transformer** utility in the Result pattern that allows you to perform side effects only on error Results without modifying them, providing a focused way to handle error cases.

## Why Use `tapError`?

While the general `tap` function works with any Result, `tapError` specifically targets error Results:
- Only execute code for error cases
- Cleaner than checking status inside a general tap
- Directly access the error value
- Skip processing for success cases
- Perfect for error handling operations

### Key Benefits
- Focused handling of error Results
- Direct access to error data
- No status checking boilerplate
- Skip processing for success Results
- Maintain original Result reference
- Clean error handling pipelines

## Usage Examples

We have a complementary set of detailed [examples](../../examples/transformers/tapError.ts) that you can view further on how to utilize the `tapError()` method

### Basic Error Handling

```typescript
const result = error(new Error("Not found"));

// Process only error results
const tappedResult = tapError(result, err => {
    console.error(`Error occurred: ${err.message}`);
    // Direct access to the error, no need to check status
});

// Success results are simply passed through
const successResult = success(42);
tapError(successResult, err => {
    // This function will not be called
    console.log("This won't run");
});
```

### Error Logging

```typescript
function logError<T, E extends Error>(
    context: string,
    result: Result<T, E>
): Result<T, E> {
    return tapError(result, err => {
        console.error(`[${context}] Error: ${err.name} - ${err.message}`);
        
        // Log to monitoring system
        errorMonitor.log({
            context,
            name: err.name,
            message: err.message,
            timestamp: new Date()
        });
    });
}

// Usage
const userResult = logError(
    'user-service', 
    fetchUser(123)
);
```

### Error Classification

```typescript
// Track error types
const errorStats: Record<string, number> = {};

function trackErrorType<T, E extends Error>(result: Result<T, E>): Result<T, E> {
    return tapError(result, err => {
        const errorType = err.name || 'Unknown';
        errorStats[errorType] = (errorStats[errorType] || 0) + 1;
    });
}

// Process a batch of results
const processedResults = results.map(trackErrorType);
```

## API Reference

### Function Signature
```typescript
function tapError<T, E>(
    result: Result<T, E>,
    fn: (error: E) => void
): Result<T, E>
```

### Parameters
- `result`: The Result to tap into
- `fn`: Side effect function to execute on error
  - Takes only the error value as its argument
  - Should not return anything
  - Only called for error results

### Returns
- The original Result object, unchanged

## Best Practices
- Use for error-specific side effects
- Keep functions simple and focused
- Use for logging and error tracking
- Use for recovery operations
- Avoid complex business logic

## Common Pitfalls
- Remember it only runs for error Results
- Don't throw exceptions from tap functions
- Don't use for transforming errors (use mapError instead)
- Side effects can make debugging harder

## TypeScript Considerations
- Direct access to typed error value
- No handling needed for success case
- Preserves the original Result reference

## Advanced Usage

### Error Monitoring System

```typescript
function monitorError<T, E extends Error>(
    service: string,
    operation: string,
    result: Result<T, E>
): Result<T, E> {
    return tapError(result, err => {
        monitoring.captureError({
            service,
            operation,
            errorType: err.name,
            message: err.message,
            stack: err.stack,
            timestamp: Date.now()
        });
    });
}
```

### Retry Queue Management

```typescript
function queueForRetry<T>(
    operationId: string,
    result: Result<T, Error>,
    maxRetries = 3
): Result<T, Error> {
    return tapError(result, err => {
        const existingRetry = retryQueue.find(r => r.id === operationId);
        
        if (existingRetry && existingRetry.attempts < maxRetries) {
            existingRetry.attempts++;
            existingRetry.lastError = err;
            existingRetry.timestamp = Date.now();
        } else if (!existingRetry) {
            retryQueue.push({
                id: operationId,
                attempts: 1,
                lastError: err,
                timestamp: Date.now(),
                operation: () => /* retry logic */
            });
        }
    });
}
```

## Related Methods
- `tap()`: Tap into any Result
- `tapSuccess()`: Tap only into success Results
- `mapError()`: Transform error values
- `chain()`: Transform with operations that might fail

## Performance Considerations
- Only executes function for error Results
- No object creation (returns original object)
- More efficient than general tap with conditional

## Functional Patterns

### Error Recovery

```typescript
function withRecovery<T, E>(
    result: Result<T, E>,
    recoveryFn: (err: E) => void
): Result<T, E> {
    return tapError(result, err => {
        try {
            // Attempt recovery operations
            recoveryFn(err);
        } catch (recoveryErr) {
            console.error("Recovery failed:", recoveryErr);
        }
    });
}
```

### Error Aggregation

```typescript
function aggregateErrors<T, E extends Error>(results: Result<T, E>[]): E[] {
    const errors: E[] = [];
    
    results.forEach(result => {
        tapError(result, err => {
            errors.push(err);
        });
    });
    
    return errors;
}
```

## When to Use vs Alternatives

- Use `tapError()` when:
  - You only need to perform actions for error Results
  - Want direct access to the error value
  - Working with error logging, monitoring, or recovery
  - Collecting error statistics

- Use `tap()` when:
  - You need to work with both success and error cases
  - Want to handle the entire Result

- Use `mapError()` when:
  - You need to transform the error value
  - Want to convert error types