# `mapError` Function Guide

The `mapError` function is a **transformer** utility in the Result pattern that transforms the error inside an error result, leaving success results unchanged.

## Why Use `mapError`?

Error transformation provides several key benefits:
- Standardize error formats
- Translate technical errors to user-friendly messages
- Adapt errors between boundaries
- Add contextual information

### Key Benefits
- Transform errors without disrupting success cases
- Create domain-specific error types
- Normalize error formats
- Improve error clarity
- Add error context

## Usage Examples

We have a complementary set of detailed [examples](../../examples/transformers/mapError.ts) that you can view further on how to utilize the `mapError()` method

### Basic Error Transformation

```typescript
// Error result with a standard Error
const errorResult = error(new Error("Database connection failed"));

// Transform to a more descriptive error
const enhancedError = mapError(errorResult, err => 
    new Error(`Critical error: ${err.message}. Please try again later.`)
);

// Success results pass through unchanged
const successResult = success(42);
const mappedSuccess = mapError(successResult, err => new Error("This won't happen"));
// mappedSuccess remains { status: "success", data: 42 }
```

### Custom Error Types

```typescript
class ValidationError extends Error {
    constructor(public field: string, message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

class UserFacingError extends Error {
    constructor(public userMessage: string, public originalError: Error) {
        super(originalError.message);
        this.name = "UserFacingError";
    }
}

// Create an error result with validation error
const validationError = error(new ValidationError("email", "Invalid email format"));

// Transform to user-friendly error
const userError = mapError(validationError, err => {
    if (err instanceof ValidationError) {
        return new UserFacingError(
            `Please check the ${err.field} field and try again.`,
            err
        );
    }
    return new UserFacingError("Please check your input and try again", err);
});
```

### Error Normalization

```typescript
// Define a standard error format
interface NormalizedError {
    category: "network" | "validation" | "auth" | "unknown";
    message: string;
    originalError: Error;
}

// Normalize different error types
const normalizedError = mapError(errorResult, err => ({
    category: determineCategory(err),
    message: createUserMessage(err),
    originalError: err
}));
```

## API Reference

### Function Signature
```typescript
function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>
```

### Parameters
- `result`: The Result to transform
- `fn`: Transformation function for error value
  - Takes the error value
  - Returns transformed error of any type

### Returns
- A new Result with:
  - Original data for successful results
  - Transformed error for error results

## Best Practices
- Use for translating technical errors to user-friendly messages
- Create standardized error formats
- Preserve error context
- Keep transformation functions pure
- Use error subclasses for better type safety

## Common Pitfalls
- Don't use to recover from errors
- Avoid side effects in transformations
- Remember success results pass through unchanged

## TypeScript Considerations
- Full type inference for transformations
- Supports transforming to different error types
- Preserves success value types

## Advanced Usage

### Error Classification

```typescript
// Classify errors into standard categories
function classifyError(result: Result<Data, Error>) {
    return mapError(result, err => {
        if (err.message.includes("network") || err.message.includes("connection")) {
            return new NetworkError(err);
        } else if (err.message.includes("permission") || err.message.includes("auth")) {
            return new AuthError(err);
        } else if (err.message.includes("validation") || err.message.includes("invalid")) {
            return new ValidationError(err);
        } else {
            return new UnknownError(err);
        }
    });
}
```

### Error Enrichment

```typescript
function enrichError<T>(result: Result<T, Error>, context: string) {
    return mapError(result, err => {
        const enrichedError = new Error(`[${context}] ${err.message}`);
        enrichedError.stack = err.stack;
        enrichedError.name = err.name;
        return enrichedError;
    });
}
```

## Related Methods
- `map()`: Transform success values
- `chain()`: Transform with operations that might fail
- `match()`: Pattern matching for results
- `tapError()`: Apply side effects to errors without changing them

## Performance Considerations
- Minimal overhead for transformations
- Creates a new Result object
- Original result is not mutated

## Functional Patterns

### Combining with other transformers

```typescript
import { map } from '~/lib/core/map';

function processApiResponse(response: Result<ApiResponse, NetworkError>) {
    return mapError(
        map(response, 
            data => transformData(data)
        ),
        err => new DisplayableError(`API error: ${err.message}`)
    );
}
```

### Error Type Conversion

```typescript
// Convert technical errors to user-friendly messages
function userFriendlyErrors<T>(result: Result<T, Error>) {
    return mapError(result, err => ({
        userMessage: translateErrorToUserMessage(err),
        technicalDetails: err,
        timestamp: new Date()
    }));
}
```

## When to Use vs Alternatives

- Use `mapError()` when:
  - Transforming error values
  - Creating user-friendly error messages
  - Normalizing error formats
  - Adding error context

- Use `match()` when:
  - Handling both success and error cases
  - Performing different actions based on result type

- Use `chain()` when:
  - Transformations might fail
  - Working with operations that return Result types