# `asyncMapError` Function Guide

The `asyncMapError` function is an **async** utility in the Result pattern that transforms the error inside an error Result using an asynchronous function, leaving success Results unchanged.

## Why Use `asyncMapError`?

While the synchronous `mapError` function is useful for simple error transformations, `asyncMapError` extends this to asynchronous operations:
- Apply asynchronous transformations to error Results
- Perform error enrichment that requires async operations
- Translate technical errors to user-friendly messages asynchronously
- Maintain the Result context through async error handling

### Key Benefits
- Transform error values with async operations
- Preserve success states without calling the transform
- Capture async errors in the transformation itself
- Create sophisticated error handling pipelines
- Maintain Result semantics across async boundaries

## Usage Examples

We have a complementary set of detailed [examples](../../examples/async/asyncMapError.ts) that you can view further on how to utilize the `asyncMapError()` method

### Basic Async Error Transformation

```typescript
// Create an error result
const errorResult = error(new Error("Database connection failed"));

// Transform asynchronously (e.g., add request context)
const enrichedError = await asyncMapError(errorResult, async err => {
  const requestContext = await getRequestContext();
  return new EnhancedError(err.message, requestContext);
});

// enrichedError now contains detailed error information
```

### Error Classification and Translation

```typescript
class UserFacingError extends Error {
  constructor(public userMessage: string, public originalError: Error) {
    super(userMessage);
    this.name = 'UserFacingError';
  }
}

// Translate technical errors to user messages
async function translateError(err: Error): Promise<UserFacingError> {
  // Fetch error translations from database or service
  const translation = await errorTranslationService.getTranslation(err.message);
  return new UserFacingError(translation, err);
}

// Apply to an error result
const userFriendlyError = await asyncMapError(
  error(new DatabaseError("ER_DUP_ENTRY", "Duplicate entry")),
  translateError
);
```

### Success Results Pass Through

```typescript
// Success results pass through unchanged
const successResult = success({ id: 123, name: "John" });
const result = await asyncMapError(successResult, async err => {
  // This function won't be called
  return translateError(err);
});
// result is still the original success Result
```

## API Reference

### Function Signature
```typescript
async function asyncMapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Promise<F>
): Promise<Result<T, F>>
```

### Parameters
- `result`: The Result to transform
  - Can be success or error Result
  - Success Results bypass the transformation
- `fn`: Async transformation function for error value
  - Takes the error value as input
  - Returns a Promise with the transformed error
  - May throw exceptions or return rejected Promises

### Returns
- A Promise that resolves to a new Result with either:
  - Original success if the input was a success Result
  - Error with the transformed error value if successful
  - New error if the transformation throws or rejects

## Best Practices
- Use for async operations on error values
- Enrich errors with additional context that requires async operations
- Log errors asynchronously while transforming them
- Handle both success and error outputs
- Create error classification and normalization pipelines

## Common Pitfalls
- Forgetting to await the result
- Assuming transformations will propagate via exceptions
- Not handling rejected promises in the transform function
- Using asyncMapError when a synchronous mapError would suffice

## TypeScript Considerations
- Preserves the success data type from the original Result
- Provides proper type inference for the transformed error
- Works with both concrete and generic types
- Maintains compatibility with TypeScript's strictNullChecks

## Advanced Usage

### Error Recovery

```typescript
async function attemptRecovery<T, E>(
  result: Result<T, E>
): Promise<Result<T, E>> {
  return asyncMapError(result, async err => {
    try {
      // Try to recover from the error
      const recoveredData = await recoveryService.recover(err);
      
      // If we successfully recovered, we could:
      // 1. Return a modified error
      return new Error(`Recovered from ${err.message}`);
      
      // 2. Or, in more advanced scenarios, use a special technique
      // to transform the Result from error to success
      // (This would require custom handling outside asyncMapError)
    } catch (recoveryError) {
      // Recovery failed, return enhanced error
      return new Error(`Recovery failed: ${err.message}, reason: ${recoveryError.message}`);
    }
  });
}
```

### Error Chaining and Aggregation

```typescript
async function enhanceWithRelatedErrors<E extends Error>(
  result: Result<any, E>
): Promise<Result<any, AggregateError>> {
  return asyncMapError(result, async primaryError => {
    // Fetch any related errors
    const relatedErrors = await errorDbService.findRelated(primaryError.message);
    
    // Combine into an aggregate error
    return new AggregateError(
      [primaryError, ...relatedErrors],
      `Primary error: ${primaryError.message} with ${relatedErrors.length} related errors`
    );
  });
}
```

## Related Methods
- `mapError()`: Synchronous version of asyncMapError
- `asyncMap()`: For async transformations of success values
- `asyncChain()`: For async operations that return Results
- `fromPromise()`: Converts a Promise to a Result

## Performance Considerations
- Creates Promises for the transformation
- Adds minimal overhead beyond Promise execution
- No impact when handling success Results (short-circuits)
- Consider batching for operations on many error Results

## Functional Patterns

### Error Pipeline Creation

```typescript
// Create a reusable error processing pipeline
function createErrorPipeline<E>(...fns: Array<(err: any) => Promise<any>>) {
  return async (result: Result<any, E>): Promise<Result<any, any>> => {
    if (result.status === 'success') {
      return result;
    }
    
    let currentResult = result;
    
    for (const fn of fns) {
      currentResult = await asyncMapError(currentResult, fn);
    }
    
    return currentResult;
  };
}

// Usage
const errorPipeline = createErrorPipeline(
  logError,
  translateError,
  enrichWithContext
);

const processedResult = await errorPipeline(
  error(new Error("Original error"))
);
```

### Conditional Error Transformation

```typescript
async function conditionalAsyncMapError<T, E, F>(
  result: Result<T, E>,
  predicate: (error: E) => boolean,
  fn: (error: E) => Promise<F>
): Promise<Result<T, E | F>> {
  if (result.status === 'success') {
    return result;
  }
  
  if (predicate(result.error)) {
    return asyncMapError(result, fn);
  }
  
  return result;
}
```

## When to Use vs Alternatives

- Use `asyncMapError()` when:
  - Transforming error values with async operations
  - Enriching errors with data from external sources
  - Translating errors asynchronously
  - Converting between error types that requires async operations

- Use regular `mapError()` when:
  - The transformation is synchronous
  - No async/await or Promises are involved
  - Performance is critical and async is not needed

- Use `asyncMap()` when:
  - Transforming success values with async operations
  - Working with the data payload instead of errors