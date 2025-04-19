# `asyncMap` Function Guide

The `asyncMap` function is an **async** utility in the Result pattern that transforms the value inside a successful Result using an asynchronous function, leaving error Results unchanged.

## Why Use `asyncMap`?

While the synchronous `map` function is useful for simple transformations, `asyncMap` extends this to asynchronous operations:
- Apply asynchronous transformations to successful Results
- Handle async operations like API calls or data fetching
- Maintain the Result context through async boundaries
- Automatically convert exceptions in async operations to error Results

### Key Benefits
- Transform success values with async operations
- Preserve error states without calling the transform
- Capture async errors in a type-safe way
- Create asynchronous data processing pipelines
- Maintain Result semantics across async boundaries

## Usage Examples

We have a complementary set of detailed [examples](../../examples/async/asyncMap.ts) that you can view further on how to utilize the `asyncMap()` method

### Basic Async Transformation

```typescript
// Create a successful result
const userResult = success({ id: 123, name: "John" });

// Transform asynchronously (e.g., fetch user's posts)
const userWithPosts = await asyncMap(userResult, async user => {
  const response = await fetch(`/api/users/${user.id}/posts`);
  const posts = await response.json();
  return { ...user, posts };
});

// userWithPosts now contains the user with their posts
```

### Error Handling

```typescript
// Error results pass through unchanged
const errorResult = error(new Error("User not found"));
const transformed = await asyncMap(errorResult, async user => {
  // This function won't be called
  return fetchUserDetails(user);
});
// transformed is still the original error Result

// Errors in the async transformation are caught
try {
  const result = await asyncMap(success(123), async id => {
    if (id > 100) {
      throw new Error("ID too large");
    }
    return await fetchData(id);
  });
  // result will be an error Result if an exception is thrown
} catch (e) {
  // This won't execute - exceptions are caught and returned as error Results
}
```

### Data Processing Pipeline

```typescript
// Create a pipeline of async transformations
const rawData = success(["data1", "data2", "data3"]);

// Step 1: Parse the data
const parsedData = await asyncMap(rawData, async items => {
  return Promise.all(items.map(item => parseItem(item)));
});

// Step 2: Enrich the data
const enrichedData = await asyncMap(parsedData, async parsedItems => {
  return Promise.all(parsedItems.map(item => enrichItem(item)));
});

// Step 3: Format the data
const formattedData = await asyncMap(enrichedData, async enrichedItems => {
  return Promise.all(enrichedItems.map(item => formatItem(item)));
});
```

## API Reference

### Function Signature
```typescript
async function asyncMap<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Promise<U>
): Promise<Result<U, E>>
```

### Parameters
- `result`: The Result to transform
  - Can be success or error Result
  - Error Results bypass the transformation
- `fn`: Async transformation function for success value
  - Takes the success value as input
  - Returns a Promise with the transformed value
  - May throw exceptions or return rejected Promises

### Returns
- A Promise that resolves to a new Result with either:
  - Success with the transformed value if successful
  - Original error if the input was an error Result
  - New error if the transformation throws or rejects

## Best Practices
- Use for async operations on Result values
- Chain multiple asyncMap calls for complex pipelines
- Prefer asyncMap over try/catch blocks with map
- Always await the result of asyncMap
- Handle both success and error outputs

## Common Pitfalls
- Forgetting to await the result
- Assuming errors will propagate via exceptions
- Not handling rejected promises in the transform function
- Using asyncMap when a synchronous map would suffice

## TypeScript Considerations
- Preserves the error type from the original Result
- Provides proper type inference for the transformed value
- Works with both concrete and generic types
- Maintains compatibility with TypeScript's strictNullChecks

## Advanced Usage

### Error Transformation Chain

```typescript
async function processWithErrorHandling<T>(result: Result<T, Error>) {
  // First transformation might fail
  const step1 = await asyncMap(result, async data => {
    return await processStep1(data);
  });
  
  // Transform any errors from step1
  const withErrorLogging = isError(step1)
    ? (logError(step1.error), step1) // Log and pass through
    : step1;
    
  // Continue with processing if we have data
  return await asyncMap(withErrorLogging, async data => {
    return await finalProcessing(data);
  });
}
```

### Dynamic Data Fetching

```typescript
async function fetchNestedData<T>(result: Result<T, Error>) {
  return await asyncMap(result, async data => {
    // Use data to determine what additional data is needed
    const references = extractReferences(data);
    
    // Fetch all referenced data in parallel
    const referencedData = await Promise.all(
      references.map(ref => fetchReference(ref))
    );
    
    // Combine original data with referenced data
    return {
      ...data,
      references: referencedData
    };
  });
}
```

## Related Methods
- `map()`: Synchronous version of asyncMap
- `asyncChain()`: For async operations that return Results
- `asyncMapError()`: For async transformations of error values
- `fromPromise()`: Converts a Promise to a Result

## Performance Considerations
- Creates Promises for the transformation
- Adds minimal overhead beyond Promise execution
- No impact when handling error Results (short-circuits)
- Consider batching for operations on large data sets

## Functional Patterns

### Compose Async Transformations

```typescript
// Create a reusable async transformation pipeline
function composeAsyncMaps<T, E>(...fns: Array<(data: any) => Promise<any>>) {
  return async (result: Result<T, E>): Promise<Result<any, E>> => {
    let currentResult = result;
    
    for (const fn of fns) {
      // Apply each transformation in sequence
      currentResult = await asyncMap(currentResult, fn);
      
      // Short-circuit on error
      if (isError(currentResult)) {
        break;
      }
    }
    
    return currentResult;
  };
}

// Usage
const processUser = composeAsyncMaps(
  fetchUserDetails,
  fetchUserPosts,
  calculateUserStats
);

const result = await processUser(success({ id: 123 }));
```

### Conditional Async Mapping

```typescript
async function conditionalAsyncMap<T, U, E>(
  result: Result<T, E>,
  predicate: (data: T) => boolean,
  fn: (data: T) => Promise<U>
): Promise<Result<T | U, E>> {
  if (isError(result)) {
    return result;
  }
  
  if (predicate(result.data)) {
    return asyncMap(result, fn);
  }
  
  return result;
}
```

## When to Use vs Alternatives

- Use `asyncMap()` when:
  - Transforming Result values with async operations
  - Building async data processing pipelines
  - Working with Promises that might reject
  - Converting between data types asynchronously

- Use regular `map()` when:
  - The transformation is synchronous
  - No async/await or Promises are involved
  - Performance is critical and async is not needed

- Use `asyncChain()` when:
  - The transformation might fail and returns a Result
  - Working with functions that return Result types