# `asyncPipe` Function Guide

The `asyncPipe` function is an **async** utility in the Result pattern that creates a pipeline of asynchronous transformations from an initial value or Result. It allows you to build complex processing flows that handle both successes and errors cleanly.

## Why Use `asyncPipe`?

While `pipe` creates transformation pipelines synchronously, `asyncPipe` extends this to asynchronous operations:
- Build complex data processing flows with multiple async steps
- Automatically handle error short-circuiting across async boundaries
- Combine operations that might return different formats (raw values, Results, Promises)
- Maintain clear pipeline structure with minimal nesting
- Create sequential async validation chains

### Key Benefits
- Creates clean, readable async processing pipelines
- Preserves error states and short-circuits processing on errors
- Handles various return types (values, Results, Promises) consistently
- Captures and converts exceptions to error Results
- Simplifies complex async workflows
- Improves code organization and maintainability

## Usage Examples

We have a complementary set of detailed [examples](../../examples/async/asyncPipe.ts) that you can view further on how to utilize the `asyncPipe()` method

### Basic Pipeline Creation

```typescript
// Create a data processing pipeline
const processedData = await asyncPipe(
  "user123",                  // Initial value
  fetchUser,                  // Get user by ID
  user => enrichUserProfile(user),  // Add extra user info
  profile => formatProfileOutput(profile)  // Format for display
);

// If any step fails, processedData will be an error Result
```

### Validation Pipeline

```typescript
// Data validation pipeline
const validationResult = await asyncPipe(
  userInput,                  // Form data to validate
  validateUsername,           // Check username requirements 
  validateEmail,              // Check email format
  validatePassword,           // Check password strength
  validateAge,                // Check age requirements
  createUserAccount           // Create account if all validations pass
);

// validationResult will be an error if any validation fails
```

### API Data Fetching

```typescript
// Fetch and process API data
const postData = await asyncPipe(
  postId,                     // Post ID to fetch
  fetchPost,                  // Get the post
  post => fetchPostAuthor(post),  // Get the author
  post => fetchPostComments(post), // Get the comments
  post => formatPostData(post)    // Format the complete data
);
```

## API Reference

### Function Signature
```typescript
async function asyncPipe<T, R = T, E = Error>(
  initialValue: T | Result<T, E>,
  ...fns: Array<(value: any) => Promise<Result<any, any>> | Result<any, any> | Promise<any> | any>
): Promise<Result<R, any>>
```

### Parameters
- `initialValue`: The starting value or Result
  - Can be a raw value which is wrapped in a success Result
  - Can be an existing Result
- `fns`: Functions to apply in sequence
  - Can return various types: Result, Promise, Promise<Result>, or raw value
  - Applied in order until an error occurs

### Returns
- A Promise that resolves to a Result with either:
  - Success with the final transformed value
  - Error from the first function that failed or threw an exception

## Best Practices
- Design functions to be single-purpose and composable
- Handle errors explicitly in transformation functions
- Use descriptive function names that indicate their purpose
- Return Results directly when a function might fail
- Ensure proper typing for complex pipelines
- Keep pipelines focused on a single responsibility

## Common Pitfalls
- Forgetting to await the result
- Creating overly complex pipelines (consider breaking them down)
- Inconsistent error handling across pipeline steps
- Not handling exceptions in transformation functions
- Mixing synchronous and asynchronous operations without care

## TypeScript Considerations
- Type inference weakens through complex pipelines
- Consider providing explicit type annotations for clarity
- Return type is always `Promise<Result<R, any>>`
- Input functions can have various return types

## Advanced Usage

### Railway-Oriented Programming

```typescript
// Railway-oriented pattern with explicit error tracking
const createOrder = async (orderInput: OrderInput) => {
  return await asyncPipe(
    orderInput,
    validateOrderInput,      // Divert to error track if invalid
    checkInventory,          // Divert if out of stock
    reserveInventory,        // Divert if reservation fails
    processPayment,          // Divert if payment fails
    generateInvoice          // Only reached if all previous steps succeed
  );
};
```

### Error Recovery

```typescript
// Attempt data fetch with fallbacks
const fetchWithFallbacks = async (id: string) => {
  return await asyncPipe(
    id,
    async (id) => {
      try {
        // Try primary data source
        const result = await primarySource.getData(id);
        if (isSuccess(result)) return result;
        
        console.log(`Primary source failed: ${result.error}`);
        // Try secondary source
        const fallback = await secondarySource.getData(id);
        if (isSuccess(fallback)) return fallback;
        
        console.log(`Secondary source failed: ${fallback.error}`);
        // Last resort
        return await cacheSource.getData(id);
      } catch (e) {
        return error(e);
      }
    },
    processData,    // Continue processing with whichever source succeeded
    formatOutput
  );
};
```

## Related Methods
- `pipe()`: Synchronous version of asyncPipe
- `asyncChain()`: For single-step async operations that return Results
- `asyncMap()`: For async transformations without failure
- `fromPromise()`: Converts a Promise to a Result

## Performance Considerations
- Creates Promises for each transformation
- Short-circuits on error Results (saving processing time)
- Consider the number of steps for large pipelines
- Avoid excessive error handling for performance-critical sections

## Functional Patterns

### Pipeline Factory

```typescript
// Create reusable pipeline templates
function createUserProcessingPipeline(customSteps: Array<(data: any) => Promise<any>>) {
  return async (userId: string) => {
    return await asyncPipe(
      userId,
      fetchUser,             // Standard first step
      ...customSteps,        // Custom processing steps
      auditUserChanges       // Standard last step
    );
  };
}

// Create specialized pipelines
const adminUserPipeline = createUserProcessingPipeline([
  assignAdminPermissions,
  setupAdminProfile,
  notifyAdminCreated
]);

const customerUserPipeline = createUserProcessingPipeline([
  createCustomerProfile,
  setupBillingAccount,
  sendWelcomeEmail
]);
```

### Domain-Specific Pipes

```typescript
// Create domain-specific pipeline creators
function createValidationPipe<T, R>(...validators: Array<(data: any) => Promise<Result<any, any>>>) {
  return async (input: T): Promise<Result<R, any>> => {
    return await asyncPipe(input, ...validators);
  };
}

// Create specialized validation pipelines
const validateUserRegistration = createValidationPipe(
  validateUsername,
  validateEmail,
  validatePassword,
  validateAge
);

const validatePaymentInfo = createValidationPipe(
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  validateBillingAddress
);
```

## When to Use vs Alternatives

- Use `asyncPipe()` when:
  - Building multi-step async processing pipelines
  - Creating sequential validation flows
  - Working with different return formats (Results, raw values)
  - Implementing Railway-Oriented Programming patterns

- Use `asyncChain()` when:
  - You need a simpler single-step transformation
  - Working with just one async operation that returns a Result
  - Type safety is more important than flexibility

- Use `pipe()` when:
  - All operations are synchronous
  - No async/await or Promises are involved