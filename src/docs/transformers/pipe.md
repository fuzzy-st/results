# `pipe` Function Guide

The `pipe` function is a **transformer** utility in the Result pattern that creates a processing pipeline from an initial value or Result through a series of operations, enabling clean and composable transformation chains.

## Why Use `pipe`?

The `pipe` function addresses several key challenges in managing complex operation flows:
- Eliminates nested function calls
- Creates clean sequential processing
- Automatically handles short-circuiting on errors
- Enables composition of operations
- Simplifies complex transformations

### Key Benefits
- Clean sequential processing
- Automatic error short-circuiting
- No nesting of function calls
- Improved readability
- Simplified complex workflows
- Functional programming style

## Usage Examples

We have a complementary set of detailed [examples](../../examples/transformers/pipe.ts) that you can view further on how to utilize the `pipe()` method

### Basic Transformation Pipeline

```typescript
// Create a simple transformation pipeline
const result = pipe(
    5,                              // Initial value
    value => success(value * 2),    // Double it
    value => success(value + 1)     // Add one
);
// result is { status: "success", data: 11 }

// Can also start with a Result
const fromResult = pipe(
    success(5),
    value => success(value * 2),
    value => success(value + 1)
);
```

### Validation Pipeline

```typescript
function validateUser(input: UserInput): Result<ValidUser, Error> {
    return pipe(
        input,
        validateRequired,       // Check required fields
        validateEmail,          // Validate email format
        validatePassword,       // Check password strength
        normalizeFields         // Format fields consistently
    );
}
```

### Error Short-Circuiting

```typescript
const result = pipe(
    userData,
    validateInput,              // If validation fails, stops here
    saveToDatabase,             // Only runs for valid data
    sendConfirmationEmail       // Only runs if database save succeeds
);
```

## API Reference

### Function Signature
```typescript
function pipe<T, R, E>(
    initialValue: T | Result<T, E>,
    ...fns: Array<(input: any) => Result<any, any>>
): Result<any, any>
```

### Parameters
- `initialValue`: The starting value or Result
  - Can be a plain value which is wrapped in a success Result
  - Can be an existing Result
- `fns`: Functions to apply in sequence
  - Each must return a Result
  - Receives the success value from the previous step
  - Short-circuits on error

### Returns
- A Result after applying all transformations or the first error encountered

## Best Practices
- Keep transformation functions small and focused
- Make each step do one thing well
- Use descriptive variable names for clarity
- Consider using specialized steps for validation
- Consider creating helper functions for common patterns

## Common Pitfalls
- Too many steps in a single pipe
- Complex logic within individual steps
- Mixing concerns within a pipeline
- Not handling errors appropriately

## TypeScript Considerations
- Type inference weakens through the pipeline
- Consider adding explicit return types to functions
- May require type assertions for complex scenarios
- Supports mixed return types in the pipeline

## Advanced Usage

### Railway-Oriented Programming

```typescript
// Railway-oriented programming with pipe
function processOrder(order: Order): Result<Invoice, Error> {
    return pipe(
        order,
        validateOrder,        // Switch to error track if invalid
        reserveInventory,     // Switch to error track if insufficient inventory
        processPayment,       // Switch to error track if payment fails
        generateInvoice       // Only reached if all previous steps succeed
    );
}
```

### Nested Pipelines

```typescript
// Create nested pipelines for complex workflows
function getUserWithPosts(userId: string): Result<UserWithPosts, Error> {
    return pipe(
        userId,
        fetchUser,
        user => pipe(
            user.id,
            fetchUserPosts,
            posts => success({ user, posts })
        )
    );
}
```

## Related Methods
- `chain()`: For single-step transformations
- `map()`: For simpler transformations without failure
- `match()`: For handling both success and error cases
- `tap()`: For side effects at specific pipeline stages

## Performance Considerations
- Each step creates a new Result object
- Early short-circuiting prevents unnecessary processing
- Consider pipeline depth in performance-critical paths
- Could be inefficient for very simple transformations

## Functional Patterns

### Custom Pipeline Creators

```typescript
// Create a reusable pipeline with common steps
function createUserPipeline(customSteps: Array<(user: User) => Result<User, Error>>) {
    return (user: User): Result<User, Error> => pipe(
        user,
        validateUser,            // Always validate first
        normalizeUserData,       // Always normalize second
        ...customSteps,          // Inject custom steps
        auditUserChanges         // Always audit at the end
    );
}

// Use the custom pipeline
const adminUserPipeline = createUserPipeline([
    assignAdminRole,
    validateAdminPermissions
]);
```

### Error Recovery

```typescript
// Create a function that attempts recovery
function withRecovery<T, E, R>(
    operation: (input: T) => Result<R, E>,
    recovery: (input: T, error: E) => Result<R, E>
): (input: T) => Result<R, E> {
    return (input: T) => {
        const result = operation(input);
        if (result.status === "error") {
            return recovery(input, result.error);
        }
        return result;
    }
}

// Use in a pipeline
const result = pipe(
    input,
    validateInput,
    withRecovery(riskyOperation, fallbackOperation),
    finalizeProcess
);
```

## When to Use vs Alternatives

- Use `pipe()` when:
  - Sequencing multiple operations
  - Creating clean transformation pipelines
  - Implementing Railway-Oriented Programming
  - Combining multiple operations with potential failures

- Use `chain()` when:
  - Performing a simple one-step transformation
  - Single operation that might fail

- Use direct composition when:
  - Very simple operations
  - Performance is critical
  - No error handling is needed