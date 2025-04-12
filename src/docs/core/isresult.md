# `isResult` Function Guide

The `isResult` function is a **type guard** utility in the Result pattern that checks whether a given value is a valid Result object.

## Why Use `isResult`?

Type safety and runtime type checking are crucial in complex applications:
- Validate Result-like objects
- Prevent type-related errors
- Provide runtime type discrimination
- Enhance type inference

### Key Benefits
- Runtime Result object validation
- Type narrowing capabilities
- Flexible type checking
- Prevents incorrect type usage

## Usage Examples

We have a complementary set of detailed [examples](../../examples/core/isTypeguards.ts) that you can view further on how to utilize `isResult()` method

### Basic Type Checking

```typescript
const value = someOperation(); // Unknown type

if (isResult(value)) {
    // TypeScript knows value is a Result
    if (value.status === 'success') {
        console.log('Successful result:', value.data);
    } else {
        console.error('Error result:', value.error);
    }
} else {
    console.log('Not a Result object');
}
```

### Filtering and Processing

```typescript
const mixedArray: unknown[] = [
    success(1),
    'string',
    error(new Error('Test')),
    { random: 'object' }
];

// Filter only Result objects
const resultObjects = mixedArray.filter(isResult);

resultObjects.forEach(result => {
    console.log(
        result.status === 'success' 
            ? `Success: ${result.data}` 
            : `Error: ${result.error}`
    );
});
```

### Validation Scenarios

```typescript
function processInput(input: unknown): void {
    // Strict type checking before processing
    if (!isResult(input)) {
        throw new Error('Invalid result object');
    }

    // At this point, TypeScript knows input is a Result
    if (input.status === 'success') {
        processSuccessfulData(input.data);
    } else {
        handleErrorResult(input.error);
    }
}
```

## API Reference

### Function Signature
```typescript
function isResult(value: unknown): value is Result<unknown, unknown>
```

### Parameters
- `value`: Any value to check
  - Can be of any type
  - Typically used with unknown or mixed inputs

### Returns
- `true` if the value is a valid Result object
- `false` otherwise
- Type predicate for TypeScript type narrowing

## Best Practices
- Use for validating external data
- Combine with other type guards
- Provide fallback handling
- Use in input validation scenarios

## Common Pitfalls
- Don't rely solely on runtime checks
- Be aware of potential performance overhead
- Ensure comprehensive type checking

## TypeScript Considerations
- Provides compile-time type narrowing
- Works with generic Result types
- Supports union types
- Minimal runtime impact

## Advanced Usage

### Dynamic Type Checking

```typescript
function validateResultShape(value: unknown): boolean {
    if (!isResult(value)) return false;

    // Additional custom validation
    if (value.status === 'success') {
        return isValidSuccessData(value.data);
    }

    return isValidErrorObject(value.error);
}

function isValidSuccessData(data: unknown): boolean {
    // Custom success data validation
    return typeof data === 'object' && data !== null;
}

function isValidErrorObject(error: unknown): boolean {
    // Custom error object validation
    return error instanceof Error;
}
```

### Safe Data Extraction

```typescript
function safeExtractData<T>(value: unknown, defaultValue: T): T {
    return isResult(value) && value.status === 'success' 
        ? value.data 
        : defaultValue;
}
```

## Related Methods
- `isSuccess()`: Checks for successful results
- `isError()`: Checks for error results
- `match()`: Pattern matching for results
- `success()`: Creates a successful result
- `error()`: Creates an error result

## Performance Considerations
- Lightweight type checking
- Minimal runtime overhead
- Optimized by modern JavaScript engines
- Use judiciously in performance-critical paths

## Type Guard Patterns

### Safe Result Processing

```typescript
function processResults<T>(results: unknown[]): T[] {
    return results
        .filter(isResult)
        .filter(result => result.status === 'success')
        .map(result => result.data);
}
```

### Comprehensive Validation

```typescript
interface ValidatedResult<T> {
    isValid: boolean;
    result?: Result<T, Error>;
}

function validateResult<T>(value: unknown): ValidatedResult<T> {
    if (!isResult(value)) {
        return { isValid: false };
    }

    return {
        isValid: true,
        result: value
    };
}
```

## When to Use vs Alternatives

- Use `isResult()` when:
  - Validating unknown data sources
  - Performing runtime type checks
  - Need to verify Result-like objects

- Use `match()` when:
  - Want to process results with different handlers
  - Need comprehensive result management

- Use Type Assertions when:
  - You're absolutely certain of the type
  - Want to override type checking
