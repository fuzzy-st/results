# `chain` Function Guide

The `chain` function is a **transformer** utility in the Result pattern that chains operations which might fail, allowing for seamless composition of functions that return Result types.

## Why Use `chain`?

While `map` transforms a successful result's value, `chain` (also known as flatMap in functional programming) allows for more powerful transformations that might fail:
- Compose multiple operations that could fail
- Eliminate deeply nested error handling
- Create clean processing pipelines
- Handle dependent operations

### Key Benefits
- Clean sequential operations
- Automatic error short-circuiting
- No nested Result structures 
- Type-safe error handling
- Elegant composition

## Usage Examples

We have a complementary set of detailed [examples](../../examples/transformers/chain.ts) that you can view further on how to utilize the `chain()` method

### Basic Usage

```typescript
// Function that might fail
function validatePositive(n: number): Result<number, Error> {
    return n > 0
        ? success(n)
        : error(new Error("Number must be positive"));
}

// Chain operations
const result = success(5);
const validated = chain(result, validatePositive);
// validated is { status: "success", data: 5 }

// Chain with negative input
const negativeResult = success(-5);
const invalidated = chain(negativeResult, validatePositive);
// invalidated is { status: "error", error: Error("Number must be positive") }
```

### Parsing and Validation Chain

```typescript
function parseNumber(str: string): Result<number, Error> {
    const num = Number(str);
    return isNaN(num) 
        ? error(new Error("Invalid number format"))
        : success(num);
}

function validateAge(age: number): Result<number, Error> {
    return age >= 18
        ? success(age)
        : error(new Error("Must be at least 18"));
}

// Chain parsing and validation
const result = chain(
    chain(success("25"), parseNumber),
    validateAge
);
// result is { status: "success", data: 25 }
```

### Data Transformation Chain

```typescript
interface User {
    id: number;
    name: string;
}

function findUser(id: number): Result<User, Error> {
    // Database lookup that might fail
    return id === 1
        ? success({ id: 1, name: "John" })
        : error(new Error("User not found"));
}

function getUserPosts(user: User): Result<Post[], Error> {
    // Another operation that might fail
    return success([
        { id: 101, title: "First post", userId: user.id }
    ]);
}

// Chain dependent operations
const posts = chain(findUser(1), getUserPosts);
```

## API Reference

### Function Signature
```typescript
function chain<T, U, E, F>(
    result: Result<T, E>,
    fn: (data: T) => Result<U, F>
): Result<U, E | F>
```

### Parameters
- `result`: The Result to transform
- `fn`: Transformation function that returns a Result
  - Takes the success value
  - Returns a new Result that might succeed or fail

### Returns
- For success input: The Result returned by the transformation function
- For error input: The original error Result (short-circuit)
- Type includes union of both possible error types

## Best Practices
- Use for operations that might fail
- Chain multiple operations for clean pipelines
- Keep transformation functions pure
- Use with validation logic
- Consider readability with long chains

## Common Pitfalls
- Excessive chaining can reduce readability
- Remember error Results short-circuit
- Different error types are combined in union type
- Each step creates a new Result object

## TypeScript Considerations
- Properly tracks error type unions
- Preserves type safety across chains
- Can infer complex nested types
- Helps catch missed error cases

## Advanced Usage

### Sequential Validation

```typescript
function validateUser(formData: FormData): Result<ValidUser, ValidationError> {
    return chain(
        chain(
            chain(
                validateUsername(formData),
                validateEmail
            ),
            validatePassword
        ),
        validateAge
    );
}
```

### Database Operation Chains

```typescript
async function getUserWithDetails(userId: number): Promise<Result<UserDetails, Error>> {
    const userResult = await findUser(userId);
    const postsResult = chain(userResult, findUserPosts);
    const friendsResult = chain(userResult, findUserFriends);
    
    // Combine the results
    return combineResults(userResult, postsResult, friendsResult);
}
```

## Related Methods
- `map()`: Transform success values without potential failure
- `mapError()`: Transform error values
- `match()`: Pattern matching for results
- `tap()`: Apply side effects without changing value

## Performance Considerations
- Early short-circuiting prevents unnecessary processing
- Creates new Result objects at each step
- Consider the depth of chains in performance-critical paths

## Functional Patterns

### Railway-Oriented Programming

```typescript
// Create a pipeline of operations
const pipeline = [
    parseInput,
    validateInput,
    transformData,
    saveToDatabase,
    generateResponse
].reduce(
    (result, operation) => chain(result, operation),
    success(initialInput)
);
```

### Result Monad

```typescript
// chain implements the monadic 'bind' or 'flatMap' operation
// This is the essence of the Result monad
const monadicResult = chain(
    success(5),
    x => chain(
        success(x * 2),
        y => success(y + 1)
    )
);
```

## When to Use vs Alternatives

- Use `chain()` when:
  - Operations might fail
  - Working with functions returning Result
  - Building pipelines of operations
  - Handling dependent operations

- Use `map()` when:
  - Transformations can't fail
  - Simple value transformations are needed
  - Performance is critical

- Use `match()` when:
  - You need more complex branching logic
  - Need to handle both success and error flows