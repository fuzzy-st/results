# Result Pattern

![npm](https://img.shields.io/npm/v/@fuzzy-street/results)
![GitHub](https://img.shields.io/github/license/fuzzy-st/results)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@fuzzy-street/results)
![npm type definitions](https://img.shields.io/npm/types/@fuzzy-street/results)

A *highly* optimized, fully **type-safe**, *dependency-free* utility for representing operations that can *either* **succeed** or **fail**.

Complete with:
- Comprehensive functional transformations
- Advanced error handling capabilities
- Async/Promise integration
- Performance optimizations
- Elegant composition patterns

Its a *fuzzy* approach where by having **better results** we can craft *more reliable code* that doesn't rely on `try/catch` and exceptions for control flow.

## 🔍 Overview

This library aims to provide an elegant solution for handling operations that can succeed or fail in TypeScript applications. It addresses the common problems with traditional exception-based error handling while maintaining full type safety and composability.

Unlike traditional error handling with exceptions, this library seeks to enable us with the following:

- **Explicit error handling** with proper type information
- **Composable operations** that might fail
- **Functional transformations** of success and error values
- **Predictable control flow** without hidden exceptional paths
- **Better testability** through deterministic error handling
- **Performance optimizations** for high-throughput scenarios

## ✨ Features

- 🧙‍♂️ **Type-Safe Results** - Experience bulletproof type safety with full TypeScript inference and precise error typing. No more "any" type nightmares or runtime surprises.

- 🔄 **Powerful Functional Transformations** - Transform your data with elegant, chainable operations like `map`, `chain`, and `pipe`. Build complex processing flows with minimal code.

- 👪 **Painless Composition** - Compose operations that might fail without deeply nested try/catch blocks. Create clean, readable code that's easy to maintain and extend.

- 🧬 **First-Class Async Support** - Handle async operations with the same elegant API. Convert Promises to Results, chain async operations, and process multiple async results in parallel.

- ⚠️ **Explicit Error Handling** - Say goodbye to forgotten try/catch blocks and silent failures. Every potential error becomes a value you can inspect, transform, and handle with precision.

- 😇 **Control Your Own Destiny** - Decide exactly when and how to extract values from results with smart unwrapping operations that prevent runtime crashes.

- 🚂 **Railway-Oriented Programming** - Implement the powerful railway pattern with built-in short-circuiting. Keep your happy path clean while ensuring errors naturally flow to error handlers.

- ⚡ **Blazing Fast Performance** - Meticulously optimized for speed and minimal memory usage. We've benchmarked extensively to ensure near-zero overhead compared to traditional error handling.
<!-- 
- 💥 **Advanced Concurrency** - Process tasks with controlled parallelism, built-in retry logic, and intelligent error handling for complex async workflows. -->

- 🤑 **Rich Combinators** - Combine multiple results with sophisticated utilities like `asyncAll` and sophisticated error aggregation. No more manual result merging.

- 💻 **Developer Experience First** - Designed for humans with clear naming, consistent behavior, and detailed documentation with practical examples for every function.

- 🆓 **Zero Dependencies** - Not a single external dependency. Just pure, optimized TypeScript that won't bloat your bundle or introduce security vulnerabilities.

- 💚 **Universal Compatibility** - Works anywhere JavaScript runs: browsers, Node.js, Deno, Bun, web workers, or serverless functions. One API to rule them all.

- 🪖 **Battle-Tested** - Comprehensive guides with real-world examples for every function. Learn through practical code, not just abstract theory.


## 🚀 Installation

```bash
# Using npm
npm install @fuzzy-street/results

# Using yarn
yarn add @fuzzy-street/results

# Using pnpm
pnpm add @fuzzy-street/results
```

## 🔍 Core Concepts

Result Pattern is built around a simple concept: a function that can either succeed or fail returns a `Result<T, E>` type, which is either:
- `{ status: "success", data: T }` for successful operations
- `{ status: "error", error: E }` for failed operations

This allows you to:
1. Make error handling explicit and type-safe
2. Create pipelines of operations where errors naturally short-circuit
3. Eliminate try/catch blocks for control flow
4. Ensure all error cases are handled

## 🧩 Basic Usage

```typescript
import { success, error, isSuccess, isError, match } from '@fuzzy-street/results';

// Creating success results
const successResult = success(42);
// { status: "success", data: 42 }

// Creating error results
const errorResult = error(new Error('Something went wrong'));
// { status: "error", error: Error("Something went wrong") }

// Type checking
if (isSuccess(successResult)) {
  console.log(successResult.data); // 42
}

if (isError(errorResult)) {
  console.log(errorResult.error.message); // "Something went wrong"
}

// Pattern matching
const message = match(successResult, {
  success: (value) => `Success: ${value}`,
  error: (err) => `Error: ${err.message}`
});
// "Success: 42"
```

## 📚 Library Structure

The library is organized into three main categories:

### Core Functions

These form the foundation of the Result pattern:
    
- [`success`](src/docs/core/success.md): Creates a successful result
- [`error`](src/docs/core/error.md): Creates an error result
- [`isSuccess`](src/docs/core/issuccess.md): Type guard for successful results
- [`isError`](src/docs/core/iserror.md): Type guard for error results
- [`isResult`](src/docs/core/isresult.md): Type guard for any result
- [`match`](src/docs/core/match.md): Pattern matching for results
- [`unwrap`](src/docs/core/unwrap.md): Extracts value or throws error
- [`unwrapOr`](src/docs/core/unwrapor.md): Extracts value with fallback

### Transformer Functions

These help transform and process results:

- [`map`](src/docs/transformers/map.md): Transforms success values
- [`mapError`](src/docs/transformers/mapError.md): Transforms error values
- [`chain`](src/docs/transformers/chain.md): Chains operations that might fail
- [`tap`](src/docs/transformers/tap.md): Performs side effects on any result
- [`tapSuccess`](src/docs/transformers/tapSuccess.md): Performs side effects on success results
- [`tapError`](src/docs/transformers/tapError.md): Performs side effects on error results
- [`pipe`](src/docs/transformers/pipe.md): Creates transformation pipelines
- [`createErrorBoundary`](src/docs/transformers/createErrorBoundary.md): Creates error-handling boundaries

### Async Functions

These handle asynchronous operations:

- [`fromPromise`](src/docs/async/fromPromise.md): Converts a Promise to a Result
- [`fromAsync`](src/docs/async/fromAsync.md): Wraps an async function to return a Result
- [`asyncMap`](src/docs/async/asyncMap.md): Maps a Result value asynchronously
- [`asyncMapError`](src/docs/async/asyncMapError.md): Maps a Result error asynchronously
- [`asyncChain`](src/docs/async/asyncChain.md): Chains async operations that return Results
- [`asyncPipe`](src/docs/async/asyncPipe.md): Creates async transformation pipelines
- [`asyncAll`](src/docs/async/asyncAll.md): Combines multiple async Results
- [`withFinally`](src/docs/async/withFinally.md): Executes cleanup after async operations
- [`createAsyncErrorBoundary`](src/docs/async/createAsyncErrorBoundary.md): Creates async error-handling boundaries

Each function has detailed documentation and examples in the linked markdown files. We highly recommend exploring these docs to understand the full capabilities of each utility.

## 🌟 Advanced Examples

### Railway-Oriented Programming

```typescript
import { pipe, success, error } from '@fuzzy-street/results';

function validateInput(input: string) {
  return input ? success(input) : error(new Error('Input required'));
}

function processInput(input: string) {
  return input.length >= 3 
    ? success(input.toUpperCase()) 
    : error(new Error('Input too short'));
}

function formatOutput(input: string) {
  return success(`Processed: ${input}`);
}

// Create a processing pipeline
const result = pipe(
  'hello',               // Input value
  validateInput,         // Validate (short-circuit if invalid)
  processInput,          // Process (short-circuit if fails)
  formatOutput           // Format output
);

// result: { status: "success", data: "Processed: HELLO" }
```

### Async Operations

```typescript
import { asyncChain, fromPromise } from '@fuzzy-street/results';

async function fetchUser(id: string) {
  return fromPromise(
    fetch(`https://api.example.com/users/${id}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
      })
  );
}

async function fetchUserPosts(user) {
  return fromPromise(
    fetch(`https://api.example.com/users/${user.id}/posts`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
      })
  );
}
    
// Chain async operations
async function getUserWithPosts(userId: string) {
  const userResult = await fetchUser(userId);
  return await asyncChain(userResult, fetchUserPosts);
}
```

### Error Handling

```typescript
import { match, success, error } from '@fuzzy-street/results';

function divideNumbers(a: number, b: number) {
  return b !== 0 
    ? success(a / b) 
    : error(new Error('Division by zero'));
}

const result = divideNumbers(10, 0);

// Pattern matching for elegant error handling
const message = match(result, {
  success: (value) => `Result: ${value}`,
  error: (err) => `Error: ${err.message}`
});

// message: "Error: Division by zero"
```

## ⚡Performance

The Result pattern has been carefully optimized to minimize overhead:

- Minimal object creation in transformations
- Early short-circuiting to avoid unnecessary processing
- Efficient memory usage with optimized data structures
- Benchmarks show minimal overhead compared to direct function calls

According to our benchmarks:
- Function call overhead is acceptable for most real-world use cases
- Error handling with Results is actually faster than traditional try/catch in many scenarios
- Memory overhead is minimal

## 🧙‍♂️ TypeScript Support

This library is built with TypeScript first in mind:

- Full type inference for all operations
- Generic type parameters for flexible usage
- Type guards for runtime type checking
- Type narrowing for improved developer experience

## 🧪 Running Examples

This repository comes with a comprehensive set of examples to demonstrate the usage of each function. To run them locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/fuzzy-st/results.git
   cd results
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run a specific example:
   ```bash
   pnpm tsx src/examples/core/success.ts
   pnpm tsx src/examples/transformers/pipe.ts
   pnpm tsx src/examples/async/asyncChain.ts
   ```

Each example file contains multiple usage patterns. To try a specific example, uncomment the corresponding `run...()` function at the bottom of the file before running it.

For example, in `src/examples/core/success.ts`:

```typescript
// Uncomment any of these to run the example
// runBasicExample();
// runValidationExample();
runComplexExample(); // This one will execute
```

We encourage you to explore these examples to get a feel for how the library works in practice. Each example corresponds to the documentation for its respective function.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
