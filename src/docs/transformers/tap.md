# `tap` Function Guide

The `tap` function is a **transformer** utility in the Result pattern that allows you to perform side effects on a Result without modifying it, making it ideal for debugging, logging, and monitoring.

## Why Use `tap`?

The `tap` function provides a clean way to:
- Add logging without disrupting processing chains
- Perform side effects at specific points in a transformation pipeline
- Debug complex Result transformations
- Collect metrics and diagnostics
- Cache or store results

### Key Benefits
- Non-invasive observation of Results
- Transparent side effects
- Maintains original Result reference
- Perfect for monitoring and debugging
- Preserves functional purity of other operations

## Usage Examples

We have a complementary set of detailed [examples](../../examples/core/tap.ts) that you can view further on how to utilize the `tap()` method

### Basic Logging

```typescript
const result = success(42);

// Log details without changing the result
const tappedResult = tap(result, r => {
    console.log(`Status: ${r.status}`);
    if (r.status === "success") {
        console.log(`Value: ${r.data}`);
    }
});

// tappedResult is still === result
```

### Debugging Transformation Chains

```typescript
const finalResult = chain(
    tap(
        map(
            tap(success(5), r => console.log("Initial:", r)),
            x => x * 2
        ),
        r => console.log("After map:", r)
    ),
    validateEven
);

console.log("Final result:", finalResult);
```

### Collecting Metrics

```typescript
function performOperation(): Result<Data, Error> {
    const startTime = Date.now();
    
    // Perform the actual operation
    const result = doSomething();
    
    // Record metrics without affecting the result
    return tap(result, r => {
        metrics.operationTime = Date.now() - startTime;
        metrics.status = r.status;
        metrics.operationCount++;
    });
}
```

## API Reference

### Function Signature
```typescript
function tap<T, E>(
    result: Result<T, E>,
    fn: (result: Result<T, E>) => void
): Result<T, E>
```

### Parameters
- `result`: The Result to tap into
- `fn`: Side effect function to execute
  - Takes the entire Result as its argument
  - Should not return anything

### Returns
- The original Result object, unchanged

## Best Practices
- Use for side effects only
- Keep tap functions simple
- Avoid modifying external state when possible
- Use strategically in transformation pipelines
- Don't throw exceptions from tap functions

## Common Pitfalls
- Avoid complex logic inside tap functions
- Remember tap doesn't modify the Result
- Don't rely on tap for transformations
- Side effects can make debugging harder

## TypeScript Considerations
- Full type inference for Result
- No type transformation (returns exactly same type)
- Preserves the original Result reference

## Advanced Usage

### Conditional Side Effects

```typescript
function conditionalTap<T, E>(
    result: Result<T, E>,
    predicate: (result: Result<T, E>) => boolean,
    fn: (result: Result<T, E>) => void
): Result<T, E> {
    if (predicate(result)) {
        return tap(result, fn);
    }
    return result;
}

// Only log errors
const loggingResult = conditionalTap(
    result,
    r => r.status === "error",
    r => console.error("Operation failed:", r.error)
);
```

### Tap for Caching

```typescript
function withCache<T, E>(
    key: string,
    result: Result<T, E>
): Result<T, E> {
    return tap(result, r => {
        if (r.status === "success") {
            cache.set(key, r.data);
        }
    });
}
```

## Related Methods
- `map()`: Transform success values
- `mapError()`: Transform error values
- `chain()`: Transform with operations that might fail
- `tapSuccess()`: Tap only into success results
- `tapError()`: Tap only into error results

## Performance Considerations
- Minimal overhead
- No object creation (returns original object)
- Side effects may impact performance

## Functional Patterns

### Monitoring a Pipeline

```typescript
function monitoredPipeline<T, E, R>(
    initial: Result<T, E>,
    transforms: Array<(r: Result<any, E>) => Result<any, E>>,
    monitor: (stage: number, result: Result<any, E>) => void
): Result<R, E> {
    return transforms.reduce(
        (result, transform, index) => 
            tap(
                transform(result),
                r => monitor(index, r)
            ),
        initial
    ) as Result<R, E>;
}
```

### Collecting Operations

```typescript
function collectResults<T, E>(results: Result<T, E>[]): { successes: T[], errors: E[] } {
    const successes: T[] = [];
    const errors: E[] = [];
    
    results.forEach(result => {
        tap(result, r => {
            if (r.status === "success") {
                successes.push(r.data);
            } else {
                errors.push(r.error);
            }
        });
    });
    
    return { successes, errors };
}
```

## When to Use vs Alternatives

- Use `tap()` when:
  - You need to perform side effects
  - Logging or debugging a Result
  - Collecting metrics
  - Adding tracing
  - Caching results

- Use specialized variants when appropriate:
  - `tapSuccess()`: Only interested in success cases
  - `tapError()`: Only interested in error cases

- Use transformers when changing the Result:
  - `map()`: Transform success values
  - `mapError()`: Transform error values
  - `chain()`: For operations that might fail