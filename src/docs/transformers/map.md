# `map` Function Guide

The `map` function is a **transformer** utility in the Result pattern that takes the data inside and *transforms* into a successful result, leaving error results unchanged.

## Why Use `map`?

Transformers like `map` enhance the utility of your Result objects by:
- Enabling value transformation without unwrapping
- Supporting composition of transformations
- Preserving error context
- Maintaining type safety

### Key Benefits
- Transform success values without handling errors
- Chain multiple transformations
- Keep the Result context intact
- Type-safe transformations
- Functional programming patterns

## Usage Examples

We have a complementary set of detailed [examples](../../examples/transformers/map.ts) that you can view further on how to utilize the `map()` method

### Basic Value Transformation

```typescript
// Successful result with a number
const numberResult = success(42);
const doubledResult = map(numberResult, x => x * 2);
// doubledResult: { status: "success", data: 84 }

// Transform a string to uppercase
const stringResult = success("hello");
const uppercaseResult = map(stringResult, str => str.toUpperCase());
// uppercaseResult: { status: "success", data: "HELLO" }

// Error results pass through unchanged
const errorResult = error(new Error("Something went wrong"));
const mappedError = map(errorResult, x => x * 2);
// mappedError: { status: "error", error: Error("Something went wrong") }
```

### Object Transformation

```typescript
// User object transformation
const userResult = success({ name: "John", age: 30 });
const profileResult = map(userResult, user => ({
    displayName: user.name,
    isAdult: user.age >= 18
}));
// profileResult: { status: "success", data: { displayName: "John", isAdult: true } }
```

### Chained Transformations

```typescript
const result = success(5);

// Chain of transformations
const finalResult = map(
    map(
        map(result, x => x * 2),
        x => x + 1
    ),
    x => x.toString()
);
// finalResult: { status: "success", data: "11" }
```

## API Reference

### Function Signature
```typescript
function map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E>
```

### Parameters
- `result`: The Result to transform
- `fn`: Transformation function for success value
  - Takes the success value
  - Returns transformed value of any type

### Returns
- A new Result with:
  - Transformed data for successful results
  - Original error for error results

## Best Practices
- Use map for synchronous transformations
- Compose complex transformations using multiple maps
- Keep transformation functions pure
- Use for data conversions and formatting

## Common Pitfalls
- Don't use map for operations that might fail
- Avoid side effects in transformation functions
- Remember error results pass through unchanged

## TypeScript Considerations
- Full type inference for transformations
- Supports transforming to different types
- Preserves error types

## Advanced Usage

### Type Conversion

```typescript
// Convert between types
const stringifiedResult = map(
    success(42),
    n => n.toString()
);
// Result<string, never>

const parsedResult = map(
    success("42"),
    s => parseInt(s, 10)
);
// Result<number, never>
```

### Data Enrichment

```typescript
function enrichUserData(result: Result<User, Error>) {
    return map(result, user => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        isVerified: Boolean(user.verificationDate),
        lastLoginFormatted: formatDate(user.lastLogin)
    }));
}
```

## Related Methods
- `mapError()`: Transform error values
- `chain()`: Transform with operations that might fail
- `match()`: Pattern matching for results
- `tap()`: Apply side effects without changing the value

## Performance Considerations
- Minimal overhead for transformations
- Creates a new Result object
- Original result is not mutated

## Functional Patterns

### Combining with other transformers

```typescript
import { mapError } from '~/lib/core/mapError';

function processApiResponse(response: Result<ApiResponse, NetworkError>) {
    return mapError(
        map(response, 
            data => transformData(data)
        ),
        err => new DisplayableError(`API error: ${err.message}`)
    );
}
```

### Creating a pipeline

```typescript
function processPipeline(input: number) {
    return [
        x => x * 2,
        x => x + 1,
        x => x.toString(),
        x => `Result: ${x}`
    ].reduce(
        (result, fn) => map(result, fn),
        success(input)
    );
}
```

## When to Use vs Alternatives

- Use `map()` when:
  - Transforming success values
  - Operations cannot fail
  - Building transformation pipelines

- Use `chain()` when:
  - Transformations might fail
  - Working with nested Results
  - Operations return Result types

- Use `match()` when:
  - Handling both success and error cases
  - Pattern matching style is preferred