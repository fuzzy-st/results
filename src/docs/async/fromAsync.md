# `fromAsync` Function Guide

The `fromAsync` function is an **async** utility in the Result pattern that wraps an async function to return a Result, automatically catching any errors that might occur during execution.

## Why Use `fromAsync`?

Async/await makes asynchronous code cleaner but still requires try/catch blocks for error handling. `fromAsync` addresses this by:
- Automatically wrapping async functions with a try/catch
- Converting successful values and errors into Results
- Maintaining function parameters and return types
- Eliminating boilerplate error handling code

### Key Benefits
- Eliminates repetitive try/catch blocks
- Standardizes error handling across async functions
- Preserves function signatures and parameter types
- Provides type-safe results
- Makes error handling explicit

## Usage Examples

We have a complementary set of detailed [examples](../../examples/async/fromAsync.ts) that you can view further on how to utilize the `fromAsync()` method

### Basic Async Function Wrapping

```typescript
// Original async function that might throw
async function fetchData(id: string): Promise<Data> {
  const response = await fetch(`/api/data/${id}`);
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json();
}

// Wrap the function to return a Result
const safeFetchData = fromAsync(fetchData);

// Use the wrapped function - no try/catch needed
const result = await safeFetchData("123");

// Handle the result
if (isSuccess(result)) {
  console.log("Data:", result.data);
} else {
  console.error("Error:", result.error.message);
}
```

### API Request Wrapper

```typescript
// Create safe versions of multiple API functions
const api = {
  getUser: fromAsync(async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return response.json();
  }),
  
  createUser: fromAsync(async (userData: UserInput) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return response.json();
  })
};

// Usage
const userResult = await api.getUser("123");
// Now userResult is a Result<User, Error>
```

### Form Submission Handler

```typescript
// Original form submission function
async function submitForm(data: FormData): Promise<SubmissionResult> {
  // Validate and submit form data
  // Might throw validation or submission errors
}

// Create a safe version
const safeSubmitForm = fromAsync(submitForm);

// Use in a form handler
async function handleFormSubmit(formData: FormData) {
  const result = await safeSubmitForm(formData);
  
  if (isSuccess(result)) {
    showSuccessMessage(result.data);
    resetForm();
  } else {
    showErrorMessage(result.error.message);
    highlightInvalidFields(result.error);
  }
}
```

## API Reference

### Function Signature
```typescript
function fromAsync<T, A extends any[]>(
  fn: (...args: A) => Promise<T>
): (...args: A) => Promise<Result<T, Error>>
```

### Parameters
- `fn`: The async function to wrap
  - Can take any number and type of arguments
  - Must return a Promise
  - Can throw any type of exception

### Returns
- A new async function that:
  - Takes the same arguments as the original function
  - Returns a Promise that resolves to a Result
  - Never throws exceptions (they're caught and converted to error Results)

## Best Practices
- Use for async functions that might throw errors
- Wrap API request functions for consistent error handling
- Use to standardize error handling across the codebase
- Create domain-specific wrapped functions
- Group related wrapped functions into modules

## Common Pitfalls
- Remember the returned function must still be awaited
- Non-Error exceptions will be converted to Error objects
- Can't return additional metadata from the `catch` block
- Loses the specific Promise rejection reason type information

## TypeScript Considerations
- Preserves parameter types from the original function
- Returns a properly typed Result
- Works with both standard and custom error types
- Maintains compatibility with TypeScript's strictNullChecks

## Advanced Usage

### Function Factory with Error Handler

```typescript
// Create a factory that adds custom error handling
function createApiFunction<T, A extends any[]>(
  fn: (...args: A) => Promise<T>,
  errorHandler?: (error: Error) => void
) {
  const wrappedFn = fromAsync(fn);
  
  return async (...args: A): Promise<Result<T, Error>> => {
    const result = await wrappedFn(...args);
    
    if (isError(result) && errorHandler) {
      errorHandler(result.error);
    }
    
    return result;
  };
}

// Usage
const getUser = createApiFunction(
  async (id: string) => fetchUser(id),
  error => logApiError('getUser', error)
);
```

### Dependency Injection

```typescript
// Create a service with injected dependencies
function createUserService(db: Database, logger: Logger) {
  return {
    getUser: fromAsync(async (id: string) => {
      logger.info(`Fetching user ${id}`);
      return await db.users.findById(id);
    }),
    
    createUser: fromAsync(async (userData: UserInput) => {
      logger.info(`Creating user`, userData);
      return await db.users.create(userData);
    }),
    
    updateUser: fromAsync(async (id: string, userData: Partial<UserInput>) => {
      logger.info(`Updating user ${id}`, userData);
      return await db.users.update(id, userData);
    })
  };
}
```

## Related Methods
- `fromPromise()`: Converts a Promise to a Result
- `asyncMap()`: Maps a Result value asynchronously
- `asyncChain()`: Chains async operations that return Results

## Performance Considerations
- Adds minimal overhead from try/catch
- Creates one additional Promise when the function is executed
- No impact when errors don't occur
- Multiple wrapping layers could affect debugging

## Functional Patterns

### Creating Safe API Interfaces

```typescript
// Original API interface
interface ApiClient {
  getUser(id: string): Promise<User>;
  getUsers(): Promise<User[]>;
  createUser(data: UserInput): Promise<User>;
  updateUser(id: string, data: Partial<UserInput>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

// Create a safe version of any API interface
type SafeAPI<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<Result<R, Error>>
    : never;
};

// Create safe API from any API implementation
function createSafeApi<T>(api: T): SafeAPI<T> {
  const safeApi = {} as SafeAPI<T>;
  
  for (const key in api) {
    if (typeof api[key] === 'function') {
      safeApi[key] = fromAsync(api[key] as any);
    }
  }
  
  return safeApi;
}

// Usage
const safeApi = createSafeApi(originalApi);
```

### Composable Async Operations

```typescript
// Compose async operations
function pipe<T, U, V>(
  f: (t: T) => Promise<Result<U, Error>>,
  g: (u: U) => Promise<Result<V, Error>>
) {
  return async (input: T): Promise<Result<V, Error>> => {
    const resultF = await f(input);
    
    if (isError(resultF)) {
      return resultF;
    }
    
    return g(resultF.data);
  };
}

// Usage
const processAndStore = pipe(
  fromAsync(processData),
  fromAsync(storeResult)
);
```

## When to Use vs Alternatives

- Use `fromAsync()` when:
  - Creating a new async function that might throw
  - Wanting consistent Result-based error handling
  - Wrapping external APIs or functions
  - Simplifying error handling in async methods

- Use `fromPromise()` when:
  - Working with a specific Promise instance
  - Converting an existing Promise to a Result

- Use direct try/catch with `success()`/`error()` when:
  - Custom error handling logic is needed
  - You need more control over the error processing
  - The function needs additional customization