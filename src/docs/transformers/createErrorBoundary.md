# `createErrorBoundary` Function Guide

The `createErrorBoundary` function is a **transformer** utility in the Result pattern that creates error-handling boundaries around code that might throw exceptions, converting them into type-safe Result objects.

## Why Use `createErrorBoundary`?

Traditional try/catch blocks can be verbose and don't integrate well with the Result pattern. Error boundaries provide:
- Clean conversion of exceptions to Results
- Domain-specific error handling
- Consistent error transformation
- Type safety for traditional throwing code
- Integration with the Result ecosystem

### Key Benefits
- Bridge between exception-based and Result-based code
- Standardized error handling
- Custom error type transformation
- Domain-specific error boundaries
- Cleaner than try/catch blocks

## Usage Examples

We have a complementary set of detailed [examples](../../examples/transformers/createErrorBoundary.ts) that you can view further on how to utilize the `createErrorBoundary()` method

### Basic Error Boundary

```typescript
// Create an error boundary with custom error transformation
const boundary = createErrorBoundary(err => 
    err instanceof Error 
        ? err 
        : new Error(`Unknown error: ${String(err)}`)
);

// Use the boundary to catch exceptions
const result = boundary(() => {
    // Code that might throw
    if (Math.random() > 0.5) {
        throw new Error("Something went wrong");
    }
    return 42;
});

// result will be a success Result with 42, or an error Result
```

### Domain-Specific Error Boundaries

```typescript
// Custom error type
class ApiError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

// Create an API-specific error boundary
const apiBoundary = createErrorBoundary(err => {
    if (err instanceof Error) {
        return new ApiError(500, err.message);
    }
    return new ApiError(400, String(err));
});

// Use in API operations
const result = apiBoundary(() => {
    // Call API that might throw
    return fetchData("/api/users");
});
```

### Error Classification

```typescript
// Classify different types of errors
const dbBoundary = createErrorBoundary(err => {
    const message = String(err);
    
    if (message.includes("connection")) {
        return new ConnectionError(message);
    }
    
    if (message.includes("permission")) {
        return new PermissionError(message);
    }
    
    return new DatabaseError(message);
});
```

## API Reference

### Function Signature
```typescript
function createErrorBoundary<E>(
    errorTransformer: (error: unknown) => E
): <T>(fn: () => T) => Result<T, E>
```

### Parameters
- `errorTransformer`: Function to transform caught errors
  - Takes any caught error (unknown type)
  - Returns a custom error type

### Returns
- A boundary function that:
  - Takes a function that might throw
  - Returns a Result with either:
    - Success value from the function
    - Error value from the transformer

## Best Practices
- Create specific boundaries for different domains
- Provide detailed error transformation
- Use meaningful error types
- Use with code that might throw exceptions
- Handle non-Error exceptions appropriately

## Common Pitfalls
- Not handling non-Error exceptions
- Overusing boundaries where direct Results would be better
- Not providing enough error context
- Using with async code without proper handling

## TypeScript Considerations
- Full type inference for success values
- Custom error type support
- Works with any function types
- Preserves function return type in Result

## Advanced Usage

### Async Boundaries

```typescript
// For proper async handling, use an async error boundary
const asyncBoundary = createErrorBoundary(err => new Error(`Async error: ${err}`));

async function safeAsyncOperation() {
    // This handles both synchronous exceptions and Promise rejections
    const result = asyncBoundary(async () => {
        await validateInput();
        return fetchData();
    });

    // For async functions, you'd need to handle the Promise in the result
    if (result.status === "success" && result.data instanceof Promise) {
        try {
            // Wait for the Promise to resolve
            const data = await result.data;
            return success(data);
        } catch (err) {
            // Handle Promise rejection
            return error(new Error(`Promise rejected: ${err}`));
        }
    }

    return result;
}
```

### Integration with External Libraries

```typescript
// Create boundary for external library
function safeJsonParse<T>(data: string): Result<T, Error> {
    return createErrorBoundary(err => 
        new Error(`JSON parse error: ${err}`)
    )(() => JSON.parse(data));
}

// Use with browser APIs
const domBoundary = createErrorBoundary(err => 
    new DOMError(`DOM operation failed: ${err}`)
);

const elementResult = domBoundary(() => 
    document.querySelector('#non-existent-element')
);
```

## Related Methods
- `pipe()`: Combine with error boundaries for pipelines
- `chain()`: For sequential operations with error handling
- `tap()`: Add logging or monitoring to error boundaries

## Performance Considerations
- Try/catch blocks have minimal overhead in modern JS engines
- Each boundary execution creates a new Result object
- Consider whether exception handling is needed at all

## Functional Patterns

### Specialized Boundary Creators

```typescript
// Create a boundary factory for a specific domain
function createDomainBoundary(domain: string) {
    return createErrorBoundary(err => 
        new DomainError(domain, `${domain} error: ${err}`)
    );
}

// Create specialized boundaries
const dbBoundary = createDomainBoundary("Database");
const apiBoundary = createDomainBoundary("API");
const uiBoundary = createDomainBoundary("UI");
```

### Safe External API Wrappers

```typescript
// Create safe wrappers around exception-throwing APIs
function createSafeApi<T extends Record<string, Function>>(
    api: T, 
    errorTransformer: (method: string, error: unknown) => Error
) {
    return Object.entries(api).reduce((safe, [method, fn]) => {
        safe[method] = (...args: any[]) => {
            const boundary = createErrorBoundary(err => 
                errorTransformer(method, err)
            );
            return boundary(() => fn(...args));
        };
        return safe;
    }, {} as Record<string, Function>);
}
```

## When to Use vs Alternatives

- Use `createErrorBoundary()` when:
  - Working with exception-throwing code
  - Integrating with external libraries
  - Wanting domain-specific error handling
  - Converting between exception and Result patterns

- Use direct try/catch when:
  - Simple one-off error handling is needed
  - Not working with the Result pattern
  - Performance is critically important

- Use purpose-built Result returning functions when:
  - Building new functionality from scratch
  - No exception handling is needed