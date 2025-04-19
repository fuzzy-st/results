# `withFinally` Function Guide

The `withFinally` function is an **async utility** in the Result pattern that guarantees execution of cleanup code regardless of the Result status, providing a pattern similar to try-finally for async Result operations.

## Why Use `withFinally`?

Resource management is critical in robust applications. The `withFinally` function provides:
- Guaranteed cleanup for async operations
- Clean error propagation
- Resource safety regardless of success or failure
- Integration with the Result pattern
- Simplified resource lifecycle management

### Key Benefits
- Ensures cleanup code always runs
- Works with both success and error Results
- Supports async cleanup functions
- Preserves original Result
- Reduces resource leaks

## Usage Examples

We have a complementary set of detailed [examples](../../examples/async/withFinally.ts) that you can view further on how to utilize the `withFinally()` method

### Basic Resource Cleanup

```typescript
// Database connection example
async function queryWithConnection(): Promise<Result<QueryResult, Error>> {
    const connection = await openDatabaseConnection();
    
    return withFinally(
        performQuery(connection),
        async () => {
            // This will run regardless of query success or failure
            await connection.close();
            console.log("Connection closed");
        }
    );
}
```

### File Operations

```typescript
async function processFile(path: string): Promise<Result<ProcessedData, Error>> {
    const fileHandle = await fs.open(path, 'r');
    
    return withFinally(
        readAndProcessFile(fileHandle),
        async () => {
            // Always close the file handle
            await fileHandle.close();
            console.log(`File ${path} closed`);
        }
    );
}
```

### API Request Tracking

```typescript
async function trackedApiRequest(endpoint: string): Promise<Result<ApiResponse, Error>> {
    const requestId = generateRequestId();
    logRequestStart(requestId, endpoint);
    
    return withFinally(
        makeApiRequest(endpoint),
        () => {
            // Always log request completion
            logRequestEnd(requestId, endpoint);
            metrics.decrementActiveRequests();
        }
    );
}
```

## API Reference

### Function Signature
```typescript
async function withFinally<T, E>(
    resultPromise: Promise<Result<T, E>>,
    finallyFn: () => void | Promise<void>
): Promise<Result<T, E>>
```

### Parameters
- `resultPromise`: Promise that resolves to a Result
  - Can be any Promise that resolves to a Result object
- `finallyFn`: Function to execute after the Result is resolved
  - Can be synchronous or asynchronous
  - Will be awaited if it returns a Promise
  - Should not take any parameters
  - Return value is ignored

### Returns
- A Promise that resolves to the original Result
- Preserves the status and data/error from the original Result

### Error Handling
- If `resultPromise` resolves to a Result, that Result is returned
- If `resultPromise` rejects, the rejection is propagated
- If `finallyFn` throws, that error is propagated (overriding any Result)

## Best Practices
- Use for resource cleanup (connections, files, locks)
- Keep finally functions simple and focused
- Handle errors appropriately in finally functions
- Use for instrumentation and metrics
- Consider separating complex logic from cleanup

## Common Pitfalls
- Throwing exceptions in finally functions
- Relying on finally function return values
- Not handling asynchronous errors in finally functions
- Forgetting to await the result of `withFinally`

## TypeScript Considerations
- Preserves Result type information
- Supports both void and Promise<void> finally functions
- Works with custom error types

## Advanced Usage

### Cleanup Chain

```typescript
async function multiResourceOperation(): Promise<Result<Data, Error>> {
    const resource1 = await acquireResource1();
    
    return withFinally(
        withFinally(
            useResources(resource1),
            async () => {
                // Inner resource cleanup
                await resource1.release();
                console.log("Resource 1 released");
            }
        ),
        () => {
            // Outer cleanup always happens last
            console.log("Operation complete");
            metrics.recordOperation();
        }
    );
}
```

### Transaction Management

```typescript
async function databaseTransaction<T>(
    db: Database,
    operation: (tx: Transaction) => Promise<Result<T, Error>>
): Promise<Result<T, Error>> {
    const tx = await db.beginTransaction();
    
    return withFinally(
        async () => {
            try {
                const result = await operation(tx);
                
                if (result.status === "success") {
                    await tx.commit();
                } else {
                    await tx.rollback();
                }
                
                return result;
            } catch (err) {
                await tx.rollback();
                throw err;
            }
        }(),
        async () => {
            // Ensure transaction is always ended
            if (tx.isActive()) {
                await tx.rollback();
                console.log("Transaction rolled back in finally");
            }
        }
    );
}
```

## Related Methods
- `asyncAll()`: Combines multiple async Results
- `createAsyncErrorBoundary()`: Create async boundaries for error handling
- `withTimeout()`: Add timeout to async operations
- `withRetry()`: Retry failed async operations

## Performance Considerations
- Adds minimal overhead to async operations
- Uses standard try-finally mechanism internally
- Awaits the finally function to ensure proper execution order
- Preserves Promise rejection behavior

## When to Use vs Alternatives

- Use `withFinally()` when:
  - Resource cleanup is needed after async operations
  - Working with the Result pattern
  - Ensuring operations are properly instrumented

- Use standard try-finally when:
  - Working with synchronous code
  - Not using the Result pattern
  - Performance is critically important

- Use `try-catch-finally` when:
  - Custom error handling and cleanup is needed
  - Working outside the Result pattern
  - Needing more control over exception flow