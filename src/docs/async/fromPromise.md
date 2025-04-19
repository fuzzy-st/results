# `fromPromise` Function Guide

The `fromPromise` function is an **async** utility in the Result pattern that converts a Promise to a Promise that resolves to a Result, providing a clean and consistent way to handle Promise success and failure states.

## Why Use `fromPromise`?

Promises provide a standard way to handle asynchronous operations, but their error handling can be verbose with try/catch blocks. The `fromPromise` function provides:
- Consistent error handling for Promises
- Clean conversion to the Result pattern
- Error transformation capabilities
- Type-safe results

### Key Benefits
- Unifies Promise and Result error handling
- Simplifies async/await error management 
- Transforms rejections to typed errors
- Bridges between Promise-based APIs and Result-based code
- Eliminates boilerplate try/catch blocks

## Usage Examples

We have a complementary set of detailed [examples](../../examples/async/fromPromise.ts) that you can view further on how to utilize the `fromPromise()` method

### Basic Promise Conversion

```typescript
// Convert a successful Promise to a Result
const successPromise = Promise.resolve(42);
const successResult = await fromPromise(successPromise);
// Result: { status: "success", data: 42 }

// Convert a rejected Promise to a Result
const failedPromise = Promise.reject(new Error("Something went wrong"));
const errorResult = await fromPromise(failedPromise);
// Result: { status: "error", error: Error("Something went wrong") }
```

### API Request Handling

```typescript
async function fetchUser(id: string) {
  return fromPromise(
    fetch(`https://api.example.com/users/${id}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
      })
  );
}

// Usage
const userResult = await fetchUser("123");
if (isSuccess(userResult)) {
  // Process user data
  processUser(userResult.data);
} else {
  // Handle error
  displayError(userResult.error.message);
}
```

### Custom Error Transformation

```typescript
class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Transform generic errors to domain-specific errors
const result = await fromPromise(
  fetchData(),
  err => new ApiError(
    err instanceof HttpError ? err.statusCode : 500,
    `API error: ${err.message}`
  )
);
```

## API Reference

### Function Signature
```typescript
async function fromPromise<T, E extends Error = Error>(
  promise: Promise<T>,
  errorTransformer?: (error: unknown) => E
): Promise<Result<T, E>>
```

### Parameters
- `promise`: The Promise to convert to a Result
  - Can be any Promise regardless of resolved type
- `errorTransformer`: Optional function to transform rejections
  - Takes any error (unknown type)
  - Returns a transformed error

### Returns
- A Promise that resolves to a Result with either:
  - Success state with the resolved Promise value
  - Error state with the rejection reason (possibly transformed)

## Best Practices
- Use to bridge external Promise-based APIs with Result-based code
- Prefer custom error transformers for domain-specific errors
- Use with async/await for cleaner code
- Consider using with fetch or other network operations
- Handle non-Error rejections with the error transformer

## Common Pitfalls
- Remember the Promise still needs to be awaited
- Error transformer should handle any possible rejection value
- Remember that unknown rejection types will be converted to Error

## TypeScript Considerations
- Provides proper type inference for both success and error states
- Can specify a custom error type for stronger type checking
- Works with any Promise type

## Advanced Usage

### Retry Mechanism

```typescript
async function fetchWithRetry<T>(url: string, retries = 3): Promise<Result<T, Error>> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    const result = await fromPromise<T>(
      fetch(url).then(r => r.json())
    );
    
    if (isSuccess(result)) {
      return result; // Success, return immediately
    }
    
    lastError = result.error;
    
    // Wait before retrying (exponential backoff)
    await new Promise(r => setTimeout(r, 2 ** attempt * 100));
  }
  
  // All attempts failed
  return error(lastError || new Error("Failed after multiple attempts"));
}
```

### Error Classification

```typescript
async function classifyApiErrors<T>(promise: Promise<T>): Promise<Result<T, ApiError>> {
  return fromPromise(
    promise,
    err => {
      // Classify different error types
      if (err instanceof TypeError) {
        return new ApiError(400, "Invalid request format");
      }
      
      if (err instanceof NetworkError) {
        return new ApiError(503, "Service unavailable");
      }
      
      if (typeof err === 'object' && err && 'statusCode' in err) {
        const statusCode = (err as any).statusCode;
        return new ApiError(statusCode, `HTTP error ${statusCode}`);
      }
      
      return new ApiError(500, `Unknown error: ${String(err)}`);
    }
  );
}
```

## Related Methods
- `fromAsync()`: Wraps an entire async function to return a Result
- `asyncMap()`: Maps a Result value asynchronously
- `asyncChain()`: Chains async operations that return Results

## Performance Considerations
- Minimal overhead beyond the Promise execution
- Error transformer adds slight processing cost on rejection
- No impact on successful Promises

## Functional Patterns

### Promise-Result Interop

```typescript
// Define Promise-Result conversion utilities
const promiseToResult = {
  // Convert Promise to Result
  from: fromPromise,
  
  // Convert Result to Promise (unwraps or rejects)
  to<T, E extends Error>(result: Result<T, E>): Promise<T> {
    if (isSuccess(result)) {
      return Promise.resolve(result.data);
    } else {
      return Promise.reject(result.error);
    }
  }
};
```

### Safe Async Operations

```typescript
async function safeOperation<T>(
  operation: () => Promise<T>,
  errorHandler: (error: Error) => void
): Promise<T | null> {
  const result = await fromPromise(operation());
  
  if (isSuccess(result)) {
    return result.data;
  } else {
    errorHandler(result.error);
    return null;
  }
}
```

## When to Use vs Alternatives

- Use `fromPromise()` when:
  - Working with existing Promise-based APIs
  - Converting between Promise and Result patterns
  - Making HTTP or other network requests
  - Handling Promise rejections in a type-safe way

- Use `fromAsync()` when:
  - Creating a new async function that returns a Result
  - Wrapping an entire async function with Result handling

- Use `try/catch` with `success()`/`error()` when:
  - More complex error handling logic is needed
  - Custom timing or logging is required between steps