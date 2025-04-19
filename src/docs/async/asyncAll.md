# `asyncAll` Function Guide

The `asyncAll` function is an **async utility** in the Result pattern that asynchronously combines multiple Results into a single Result with an array of values, handling both successful and error cases gracefully.

## Why Use `asyncAll`?

When working with multiple async operations that return Results, `asyncAll` provides:
- Simple aggregation of multiple async Results
- Early error detection and propagation
- Type-safe collection of successful values
- Clean, Promise-based interface
- Improved readability for parallel operations

### Key Benefits
- Combine multiple async operations
- Short-circuit on first error
- Handle Promise rejections safely
- Preserve type information
- Reduce boilerplate code

## Usage Examples

## Usage Examples

We have a complementary set of detailed [examples](../../examples/async/asyncAll.ts) that you can view further on how to utilize the `asyncAll()` method


### Basic Usage

```typescript
// Multiple async operations that return Results
const fetchUsers = async () => {
    const userPromises = [
        fetchUser(1),
        fetchUser(2),
        fetchUser(3)
    ];
    
    // Combine all user Results
    const usersResult = await asyncAll(userPromises);
    
    if (usersResult.status === "success") {
        // usersResult.data is an array of all users
        return success(usersResult.data);
    } else {
        // If any fetch failed, this will be the first error
        return error(usersResult.error);
    }
};
```

### Parallel API Requests

```typescript
async function fetchDashboardData(userId: string): Promise<Result<Dashboard, Error>> {
    // Run all requests in parallel
    const dashboardResult = await asyncAll([
        fetchUserProfile(userId),
        fetchUserStats(userId),
        fetchRecentActivity(userId),
        fetchNotifications(userId)
    ]);
    
    // If all requests succeed, combine the data
    return dashboardResult.status === "success"
        ? success({
            profile: dashboardResult.data[0],
            stats: dashboardResult.data[1],
            activity: dashboardResult.data[2],
            notifications: dashboardResult.data[3]
        })
        : dashboardResult; // Return the first error
}
```

### Resource Management

```typescript
async function processMultipleFiles(filePaths: string[]): Promise<Result<ProcessedData[], Error>> {
    // Create array of file processing promises
    const filePromises = filePaths.map(path => 
        processFile(path)
    );
    
    // Process all files and get combined result
    return await asyncAll(filePromises);
}
```

## API Reference

### Function Signature
```typescript
async function asyncAll<T, E>(
    results: Promise<Result<T, E>>[]
): Promise<Result<T[], E>>
```

### Parameters
- `results`: Array of Promises that resolve to Results
  - Each Promise should resolve to a Result of the same type
  - Can mix both successful and error Results

### Returns
- A Promise that resolves to:
  - A successful Result containing an array of all success values, if all Results are successful
  - The first error Result encountered, if any Result is an error

### Error Handling
- If any Result is an error, it short-circuits and returns that error
- If any Promise rejects, the rejection is caught and converted to an error Result

## Best Practices
- Use for parallel operations that return Results
- Keep the number of parallel operations reasonable
- Consider resource constraints for large arrays
- Use type parameters for specific types
- Process the combined Result appropriately

## Common Pitfalls
- Overwhelming system resources with too many parallel operations
- Not handling the error case from the combined Result
- Mismatched Result types in the input array

## TypeScript Considerations
- Preserves type information for success values
- Works with generic Result types
- Supports custom error types

## Advanced Usage

### Combining with Mapping

```typescript
// Fetch and transform multiple resources
async function fetchAndTransform<T, R, E>(
    ids: string[],
    fetchFn: (id: string) => Promise<Result<T, E>>,
    transformFn: (data: T) => R
): Promise<Result<R[], E>> {
    // Create array of fetch operations
    const fetchPromises = ids.map(id => fetchFn(id));
    
    // Combine all results
    const combinedResult = await asyncAll(fetchPromises);
    
    // Transform if successful
    if (combinedResult.status === "success") {
        return success(combinedResult.data.map(transformFn));
    }
    
    return combinedResult;
}
```

### With Error Recovery

```typescript
// Try to recover from errors in individual operations
async function withRecovery<T, E>(
    operations: Array<() => Promise<Result<T, E>>>,
    recovery: (err: E) => Promise<Result<T, E>>
): Promise<Result<T[], E>> {
    // Create array of operations with recovery
    const promises = operations.map(async op => {
        const result = await op();
        if (result.status === "error") {
            return await recovery(result.error);
        }
        return result;
    });
    
    // Combine all results
    return asyncAll(promises);
}
```

## Related Methods
- `withFinally()`: Execute cleanup after async operations
- `createAsyncErrorBoundary()`: Create async boundaries for error handling
- `withTimeout()`: Add timeout to async operations
- `withRetry()`: Retry failed async operations

## Performance Considerations
- Uses `Promise.all` internally for efficient parallel execution
- Short-circuits on first error for better performance
- Pre-allocates result array size for memory efficiency
- Handles Promise rejections gracefully

## When to Use vs Alternatives

- Use `asyncAll()` when:
  - You need to combine multiple async Results
  - Running operations in parallel is desired
  - Short-circuiting on first error is desired

- Use `Promise.all` directly when:
  - Not working with the Result pattern
  - Performance is critically important
  - Custom error handling is needed

- Use sequential operations when:
  - Operations have dependencies
  - Resource constraints require limiting concurrency
  - Order of execution matters