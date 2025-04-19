# `createAsyncErrorBoundary` Function Guide

The `createAsyncErrorBoundary` function is an **async utility** in the Result pattern that creates boundary functions for catching and transforming errors in asynchronous operations, providing domain-specific error handling for Promise-based code.

## Why Use `createAsyncErrorBoundary`?

Async code requires special error handling considerations. `createAsyncErrorBoundary` provides:
- Clean error handling for async operations
- Domain-specific error transformation
- Integration with Promise-based code
- Conversion of Promise rejections to Result types
- Consistent error handling across async boundaries

### Key Benefits
- Simplifies async error handling
- Creates customized error boundaries
- Normalizes async errors
- Provides consistent error patterns
- Bridges Promise rejections to Results

## Usage Examples

We have a complementary set of detailed [examples](../../examples/async/createAsyncErrorBoundary.ts) that you can view further on how to utilize the `createAsyncErrorBoundary()` method


### API Request Error Handling

```typescript
// Define a custom API error type
class ApiError extends Error {
    constructor(public statusCode: number, message: string, public originalError?: Error) {
        super(message);
        this.name = "ApiError";
    }
}

// Create an async boundary for API requests
const apiBoundary = createAsyncErrorBoundary(err => {
    if (err instanceof Error) {
        return new ApiError(500, `API Error: ${err.message}`, err);
    }
    return new ApiError(400, `API Error: ${String(err)}`);
});

// Use the boundary for async fetch operations
async function fetchData(url: string) {
    return apiBoundary(async () => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    });
}
```

### Database Operation Error Handling

```typescript
// Define a database error type
class DatabaseError extends Error {
    constructor(public operation: string, public code: string, message: string) {
        super(message);
        this.name = "DatabaseError";
    }
}

// Create an async boundary for database operations
const dbBoundary = createAsyncErrorBoundary(err => {
    const message = err instanceof Error ? err.message : String(err);
    const code = message.includes("duplicate") ? "DUPLICATE_ENTRY" :
                message.includes("not found") ? "NOT_FOUND" : 
                "UNKNOWN_ERROR";
                
    return new DatabaseError("query", code, message);
});

// Use the boundary for database operations
async function queryDatabase(query: string, params: any[]) {
    return dbBoundary(async () => {
        const connection = await getConnection();
        try {
            return await connection.query(query, params);
        } finally {
            await connection.release();
        }
    });
}
```

### File System Operations

```typescript
// Create a boundary for file system operations
const fsBoundary = createAsyncErrorBoundary(err => {
    const message = err instanceof Error ? err.message : String(err);
    
    if (message.includes("no such file")) {
        return new FileNotFoundError(message);
    } else if (message.includes("permission denied")) {
        return new PermissionError(message);
    } else {
        return new FileSystemError(message);
    }
});

// Use the boundary for file operations
async function readConfigFile(path: string) {
    return fsBoundary(async () => {
        const data = await fs.readFile(path, 'utf8');
        return JSON.parse(data);
    });
}
```

## API Reference

### Function Signature
```typescript
function createAsyncErrorBoundary<E>(
    errorTransformer: (error: unknown) => E
): <T>(fn: () => Promise<T>) => Promise<Result<T, E>>
```

### Parameters
- `errorTransformer`: Function to transform caught errors
  - Takes any caught error (unknown type)
  - Returns a custom error type
  - Called for all caught exceptions and Promise rejections

### Returns
- An async boundary function that:
  - Takes an async function that might throw or reject
  - Returns a Promise resolving to a Result with either:
    - Success value from the function
    - Error value from the transformer

## Best Practices
- Create specific boundaries for different domains
- Provide detailed error transformation
- Use meaningful error types
- Handle Promise rejections appropriately
- Keep error transformers pure and side-effect free

## Common Pitfalls
- Not handling non-Error exceptions
- Forgetting to handle Promise rejections
- Mixing synchronous and asynchronous code incorrectly
- Overly complex error transformers
- Not awaiting the boundary function result

## TypeScript Considerations
- Full type inference for async operations
- Custom error type support
- Preserves function return type in Result
- Handles Promise unwrapping automatically

## Advanced Usage

### Error Classification System

```typescript
// Create a comprehensive error classification system
function createDomainBoundary(domain: string) {
    return createAsyncErrorBoundary(err => {
        const message = err instanceof Error ? err.message : String(err);
        const errorCode = classifyError(message);
        
        return {
            domain,
            code: errorCode,
            message: `[${domain}:${errorCode}] ${message}`,
            timestamp: new Date(),
            originalError: err instanceof Error ? err : undefined
        };
    });
}

// Create domain-specific boundaries
const apiBoundary = createDomainBoundary("API");
const dbBoundary = createDomainBoundary("DATABASE");
const fsBoundary = createDomainBoundary("FILESYSTEM");
```

### Integration with External Libraries

```typescript
// Create boundary for third-party library
function createSafeApiClient(baseUrl: string) {
    const boundary = createAsyncErrorBoundary(err => {
        // Transform library-specific errors to domain errors
        if (err.name === "AxiosError") {
            return new ApiError(err.response?.status || 500, err.message);
        }
        return new Error(`API client error: ${err}`);
    });
    
    return {
        get: async (path: string) => boundary(async () => {
            const response = await axios.get(`${baseUrl}${path}`);
            return response.data;
        }),
        
        post: async (path: string, data: any) => boundary(async () => {
            const response = await axios.post(`${baseUrl}${path}`, data);
            return response.data;
        })
    };
}
```

## Related Methods
- `asyncAll()`: Combines multiple async Results
- `withFinally()`: Execute cleanup after async operations
- `createErrorBoundary()`: Synchronous version for non-async code
- `withRetry()`: Retry failed async operations

## Performance Considerations
- Try/catch blocks have minimal overhead in modern JS engines
- Each boundary execution creates a new Promise and Result object
- Error transformation adds slight overhead for error cases
- No performance impact for successful operations

## When to Use vs Alternatives

- Use `createAsyncErrorBoundary()` when:
  - Working with async code that might throw or reject
  - Needing domain-specific error handling
  - Integrating Promise-based code with the Result pattern
  - Bridging between exception-based and Result-based code

- Use direct try/catch when:
  - Simple one-off error handling is needed
  - Not working with the Result pattern
  - Performance is critically important

- Use `createErrorBoundary()` when:
  - Working with synchronous code that might throw
  - Not dealing with Promises