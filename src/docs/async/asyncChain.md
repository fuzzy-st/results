# `asyncChain` Function Guide

The `asyncChain` function is an **async** utility in the Result pattern that combines the functionality of `chain` with async operations. It allows you to transform a successful Result using an async function that might fail, creating a powerful tool for async workflows.

## Why Use `asyncChain`?

While the synchronous `chain` function is useful for transformations that might fail, `asyncChain` extends this to asynchronous operations:
- Handle async operations that return Results (like API calls)
- Create sequential async validation and processing pipelines
- Properly propagate errors across async boundaries
- Maintain the Result semantics in async code
- Compose complex async workflows

### Key Benefits
- Transform success values with async operations that might fail
- Preserve error states without calling the transform
- Capture and convert async exceptions to error Results
- Create rich async data processing pipelines
- Short-circuit processing on errors
- Simplify async error handling

## Usage Examples

We have a complementary set of detailed [examples](../../examples/async/asyncChain.ts) that you can view further on how to utilize the `asyncChain()` method

### Basic Async Chaining

```typescript
// Create a success result
const userResult = success({ id: 123, name: "John" });

// Chain to an async operation that might fail
const postsResult = await asyncChain(userResult, async user => {
  try {
    const response = await fetch(`/api/users/${user.id}/posts`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const posts = await response.json();
    return success(posts);
  } catch (err) {
    return error(err);
  }
});

// Success: postsResult contains user's posts
// Error: postsResult contains the error from the fetch
```

### Error Short-Circuiting

```typescript
// Error results pass through unchanged
const errorResult = error(new Error("User not found"));
const result = await asyncChain(errorResult, async user => {
  // This function won't be called
  return await fetchUserPosts(user);
});
// result still contains the original error
```

### Multi-Step Validation Pipeline

```typescript
// Sequential validation steps
async function validateUser(userData: UserInput): Promise<Result<ValidUser, Error>> {
  // Step 1: Start with input
  const inputResult = success(userData);
  
  // Step 2: Validate username
  const usernameResult = await asyncChain(
    inputResult,
    validateUsername
  );
  
  // Step 3: Validate email
  const emailResult = await asyncChain(
    usernameResult,
    validateEmail
  );
  
  // Step 4: Validate password
  const passwordResult = await asyncChain(
    emailResult,
    validatePassword
  );
  
  // Final transformation
  return await asyncChain(
    passwordResult,
    createUser
  );
}
```

## API Reference

### Function Signature
```typescript
async function asyncChain<T, U, E, F>(
  result: Result<T, E>,
  fn: (data: T) => Promise<Result<U, F>>
): Promise<Result<U, E | F>>
```

### Parameters
- `result`: The Result to transform
  - Can be success or error Result
  - Error Results bypass the transformation
- `fn`: Async function that transforms a success value
  - Takes the success value as input
  - Returns a Promise resolving to a Result
  - May throw exceptions (which are converted to error Results)

### Returns
- A Promise that resolves to a Result with either:
  - Success with the transformed value if both result and fn succeed
  - Original error if the input was an error Result
  - New error if the transformation returns or throws an error

## Best Practices
- Use for async operations that might fail
- Handle async exceptions inside fn when possible
- Create sequential validation pipelines
- Chain multiple asyncChain calls for complex workflows
- Always await the result of asyncChain
- Handle both success and error cases

## Common Pitfalls
- Forgetting to await the result
- Returning a raw value instead of a Result from fn
- Not handling promise rejections in the async function
- Using asyncChain when asyncMap would suffice (for operations that can't fail)
- Creating deeply nested chains instead of sequential operations

## TypeScript Considerations
- Combines both error types from original Result and transformation
- Provides proper type inference for the transformed value
- Works with both concrete and generic types
- Maintains compatibility with TypeScript's strictNullChecks

## Advanced Usage

### Error Recovery

```typescript
async function withErrorRecovery<T, E>(operation: () => Promise<Result<T, E>>) {
  // First try the primary operation
  const result = await operation();
  
  // If it succeeds, return the result
  if (isSuccess(result)) {
    return result;
  }
  
  // If it fails, attempt recovery
  return await asyncChain(result, async error => {
    try {
      console.log(`Attempting to recover from error: ${error.message}`);
      // Try alternative approach
      const recoveredData = await fallbackOperation();
      return success(recoveredData);
    } catch (recoveryError) {
      // If recovery fails, return enhanced error
      return error(new Error(
        `Failed to recover: ${error.message}, recovery error: ${recoveryError.message}`
      ));
    }
  });
}
```

### API Request Chain

```typescript
async function fetchUserData(userId: string): Promise<Result<UserProfile, Error>> {
  // Step 1: Fetch user
  const userResult = await api.getUser(userId);
  
  // Step 2: Fetch user's posts
  const postsResult = await asyncChain(userResult, async user => {
    const postsData = await api.getUserPosts(user.id);
    return success({
      ...user,
      posts: postsData
    });
  });
  
  // Step 3: Fetch user's followers
  return await asyncChain(postsResult, async userWithPosts => {
    const followersData = await api.getUserFollowers(userWithPosts.id);
    return success({
      ...userWithPosts,
      followers: followersData
    });
  });
}
```

## Related Methods
- `chain()`: Synchronous version of asyncChain
- `asyncMap()`: For async transformations without failure
- `asyncMapError()`: For async transformations of error values
- `fromPromise()`: Converts a Promise to a Result

## Performance Considerations
- Creates Promises for each transformation
- Short-circuits on error Results (no wasted operations)
- Error handling adds minimal overhead
- Consider alternatives to deep chains for performance-critical code

## Functional Patterns

### Railway-Oriented Programming

```typescript
// The core of Railway-Oriented Programming:
// - Success values stay on the "success track"
// - Error values get diverted to the "error track"
// - Once on the error track, operations are skipped

async function processOrder(orderData: OrderInput): Promise<Result<OrderConfirmation, Error>> {
  return await asyncChain(
    await asyncChain(
      await asyncChain(
        await asyncChain(
          success(orderData),
          validateOrder
        ),
        reserveInventory
      ),
      processPayment
    ),
    generateConfirmation
  );
  
  // If any step fails, the error Result bypasses all subsequent operations
  // and the error is returned directly
}
```

### Promise-Compatible Pipes

```typescript
// Create a function to pipe asyncChain operations
function pipe<T, E>(...functions: Array<(data: any) => Promise<Result<any, E>>>) {
  return async (initialValue: T | Result<T, E>): Promise<Result<any, E>> => {
    // Start with initial value as a success Result
    let result = initialValue instanceof Object && 'status' in initialValue
      ? initialValue as Result<T, E>
      : success(initialValue) as Result<T, E>;
    
    // Apply each function in sequence
    for (const fn of functions) {
      result = await asyncChain(result, fn);
      
      // Short-circuit on error
      if (isError(result)) break;
    }
    
    return result;
  };
}

// Usage
const processData = pipe(
  validateInput,
  transformData,
  saveToDatabase,
  notifyUser
);

const result = await processData(inputData);
```

## When to Use vs Alternatives

- Use `asyncChain()` when:
  - You have async operations that might fail
  - Building sequential validation or processing pipelines
  - Transforming success values to different types asynchronously
  - Dealing with operations that return Result types

- Use `asyncMap()` when:
  - The async transformation can't fail
  - You want to transform a success value asynchronously
  - Simpler types are needed (no union of error types)

- Use direct async/await with try/catch when:
  - The operation is simple and doesn't benefit from Result semantics
  - You prefer imperative style for specific scenarios
  - Performance is absolutely critical