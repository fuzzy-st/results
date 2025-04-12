# `success` Function Guide

The `success` function is a **core** utility in the Result pattern that creates a type-safe successful result, wrapping any value into a standardized success object.

## Why Use `success`?

In modern application development, you need a consistent way to represent successful operations. The `success` function provides:
- Consistent success representation
- Type-safe result wrapping
- Flexible value handling
- Clear operation outcomes

### Key Benefits
- Standardizes successful result structure
- Enables type-safe result handling
- Works with any data type
- Facilitates functional programming patterns

## Usage Examples

We have a complementary set of detailed [examples](../../examples/core/success.ts) that you can view further on how to utilize `success()` method

### Basic Success Creation

```typescript
// Success with a number
const numberResult = success(42);

// Success with a string
const stringResult = success('Operation completed');

// Success with an object
const userResult = success({ 
    id: 1, 
    name: 'John Doe' 
});

// Success with null (representing "no data" scenarios)
const nullResult = success(null);
```

### Validation Scenario

```typescript
function validateUsername(username: string): Result<string, Error> {
    if (!username) {
        return error(new Error('Username cannot be empty'));
    }

    if (username.length < 5) {
        return error(new Error('Username too short'));
    }

    // Successful validation
    return success(username);
}

// Usage
const validResult = validateUsername('johndoe');
// Result: { status: 'success', data: 'johndoe' }
```

### Async Operation Example

```typescript
async function fetchUser(id: number): Promise<Result<User, Error>> {
    try {
        const user = await userService.getById(id);
        return success(user);
    } catch (err) {
        return error(err);
    }
}

// Usage
const result = await fetchUser(42);
```

## API Reference

### Function Signature
```typescript
function success<T>(data: T): Result<T>
```

### Parameters
- `data`: The value to be wrapped
  - Can be of any type
  - Supports primitive, object, array, null, and undefined values

### Returns
- A Result object with:
  - `status`: Always set to `'success'`
  - `data`: The provided value

## Best Practices
- Use `success()` for operations that complete without errors
- Wrap all successful operation results
- Be consistent with return types
- Consider using with `match()` for comprehensive result handling

## Common Pitfalls
- Don't use `success()` for error scenarios
- Ensure the wrapped value makes sense in context
- Be mindful of type inference

## TypeScript Considerations
- Leverages TypeScript's generics for type safety
- Provides strong type inference
- Supports union and intersection types

## Type Inference Examples

```typescript
// Explicit type
const explicitResult = success<number | string>(42);

// Inferred type
const inferredResult = success({ 
    id: 1, 
    name: 'John' 
}); // Inferred as Result<{ id: number, name: string }>
```

## Related Methods
- `error()`: Creates an error result
- `match()`: Pattern matching for results
- `isSuccess()`: Type guard to check for successful results
- `unwrap()`: Extracts value from successful results

## Performance Considerations
- Lightweight operation
- Minimal runtime overhead
- Zero-cost abstraction in most cases

## Advanced Usage

### Handling Optional Results

```typescript
interface User {
    id: number;
    name: string;
}

function findUserById(id: number): Result<User | null, Error> {
    const user = users.find(u => u.id === id);
    return success(user || null);
}
```

### Lazy Evaluation

```typescript
function computeExpensiveValue(): Result<number, Error> {
    // Only computed when needed
    return success(() => {
        // Expensive computation
        return Array.from({length: 1000000}, (_, i) => i)
            .reduce((a, b) => a + b, 0);
    });
}
```
