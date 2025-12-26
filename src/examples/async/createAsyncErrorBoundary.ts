/**
 * Examples demonstrating the usage of the createAsyncErrorBoundary method
 * from the Result pattern library.
 */

import { createAsyncErrorBoundary } from "~/lib/async/createAsyncErrorBoundary";
import { isError } from "~/lib/core/isError";
import { isSuccess } from "~/lib/core/isSuccess";
import type { Result } from "~/types";

/**
 * Example 1: Basic Async Error Boundary Usage
 *
 * Demonstrates the basic usage of createAsyncErrorBoundary for handling async errors
 */
export async function basicAsyncErrorBoundaryExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 1: Basic Async Error Boundary Usage");

  // Create a simple error boundary that wraps errors in a standard format
  const simpleAsyncBoundary = createAsyncErrorBoundary((err) => {
    if (err instanceof Error) {
      return err;
    }
    return new Error(`Unknown error: ${String(err)}`);
  });

  // Successful async operation
  console.log("Successful async operation:");
  const successResult = await simpleAsyncBoundary(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return 42;
  });

  console.log("Success result:", successResult);

  // Failing async operation (throwing Error)
  console.log("\nFailing async operation (Error):");
  const errorResult = await simpleAsyncBoundary(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    throw new Error("Something went wrong");
  });

  console.log("Error result:", errorResult);

  // Failing async operation (throwing string)
  console.log("\nFailing async operation (string):");
  const stringErrorResult = await simpleAsyncBoundary(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    throw "String exception";
  });

  console.log("String error result:", stringErrorResult);

  // Failing async operation (throwing object)
  console.log("\nFailing async operation (object):");
  const objectErrorResult = await simpleAsyncBoundary(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    throw { code: 500, message: "Internal server error" };
  });

  console.log("Object error result:", objectErrorResult);

  // Promise rejection
  console.log("\nPromise rejection:");
  const rejectionResult = await simpleAsyncBoundary(async () => {
    return Promise.reject(new Error("Promise rejected"));
  });

  console.log("Rejection result:", rejectionResult);

  return {
    successResult,
    errorResult,
    stringErrorResult,
    objectErrorResult,
    rejectionResult,
  };
}

/**
 * Example 2: API Request Error Handling
 *
 * Shows how to use createAsyncErrorBoundary for API request error handling
 */
export async function apiRequestErrorHandlingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 2: API Request Error Handling");

  // Define custom API error types
  class ApiError extends Error {
    constructor(
      public statusCode: number,
      message: string,
      public originalError?: Error,
    ) {
      super(message);
      this.name = "ApiError";
    }
  }

  class NetworkError extends ApiError {
    constructor(message: string, originalError?: Error) {
      super(0, message, originalError);
      this.name = "NetworkError";
    }
  }

  class HttpError extends ApiError {
    constructor(
      statusCode: number,
      message: string,
      public responseBody?: any,
    ) {
      super(statusCode, message);
      this.name = "HttpError";
    }
  }

  // Create an API-specific error boundary
  const apiBoundary = createAsyncErrorBoundary((err) => {
    console.log("API error transformer called with:", err);

    // Handle network errors
    if (err instanceof Error && err.message.includes("network")) {
      return new NetworkError(err.message, err);
    }

    // Handle HTTP errors
    if (typeof err === "object" && err !== null && "status" in err) {
      const status = (err as any).status;
      const body = (err as any).body;
      return new HttpError(status, `HTTP Error ${status}`, body);
    }

    // Handle any other errors
    return new ApiError(
      500,
      err instanceof Error ? err.message : String(err),
      err instanceof Error ? err : undefined,
    );
  });

  // Simulated fetch function
  async function fetchWithErrors(url: string): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (url.includes("network-error")) {
      throw new Error("Failed to fetch: network error");
    }

    if (url.includes("timeout")) {
      throw new Error("Request timed out");
    }

    if (url.includes("404")) {
      throw {
        status: 404,
        body: { error: "Not found" },
      };
    }

    if (url.includes("500")) {
      throw {
        status: 500,
        body: { error: "Internal server error" },
      };
    }

    return { data: "Success response", status: 200 };
  }

  // Use the API boundary to make requests
  async function safeApiGet(url: string) {
    return apiBoundary(async () => {
      const response = await fetchWithErrors(url);
      return response.data;
    });
  }

  // Make various API requests
  console.log("Successful request:");
  const successResult = await safeApiGet("https://api.example.com/users");
  console.log("Success result:", successResult);

  console.log("\nNetwork error request:");
  const networkErrorResult = await safeApiGet("https://api.example.com/network-error");
  console.log("Network error result:", networkErrorResult);

  console.log("\nTimeout request:");
  const timeoutResult = await safeApiGet("https://api.example.com/timeout");
  console.log("Timeout result:", timeoutResult);

  console.log("\n404 request:");
  const notFoundResult = await safeApiGet("https://api.example.com/404");
  console.log("Not found result:", notFoundResult);

  console.log("\n500 request:");
  const serverErrorResult = await safeApiGet("https://api.example.com/500");
  console.log("Server error result:", serverErrorResult);

  // Error handling based on error type
  function handleApiError(result: Result<string, ApiError>): string {
    if (isSuccess(result)) {
      return `API response: ${result.data}`;
    }

    const error = result.error;

    if (error instanceof NetworkError) {
      return `Network error: ${error.message}. Please check your connection.`;
    }

    if (error instanceof HttpError) {
      if (error.statusCode === 404) {
        return "The requested resource was not found.";
      }

      if (error.statusCode >= 500) {
        return "The server encountered an error. Please try again later.";
      }

      return `HTTP error ${error.statusCode}: ${error.message}`;
    }

    return `API error: ${error.message}`;
  }

  // Demonstrate error handling
  console.log("\nError handling results:");
  console.log("Success handling:", handleApiError(successResult));
  console.log("Network error handling:", handleApiError(networkErrorResult));
  console.log("Not found handling:", handleApiError(notFoundResult));
  console.log("Server error handling:", handleApiError(serverErrorResult));

  return {
    successResult,
    networkErrorResult,
    timeoutResult,
    notFoundResult,
    serverErrorResult,
  };
}

/**
 * Example 3: Database Operation Error Handling
 *
 * Demonstrates using createAsyncErrorBoundary for database operations
 */
export async function databaseErrorHandlingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 3: Database Operation Error Handling");

  // Define database error types
  class DatabaseError extends Error {
    constructor(
      public code: string,
      message: string,
      public operation: string,
      public originalError?: Error,
    ) {
      super(message);
      this.name = "DatabaseError";
    }
  }

  class ConnectionError extends DatabaseError {
    constructor(message: string, operation: string) {
      super("CONNECTION_ERROR", message, operation);
      this.name = "ConnectionError";
    }
  }

  class QueryError extends DatabaseError {
    constructor(
      code: string,
      message: string,
      public query: string,
    ) {
      super(code, message, "query");
      this.name = "QueryError";
    }
  }

  class TransactionError extends DatabaseError {
    constructor(code: string, message: string, operation: string) {
      super(code, message, operation);
      this.name = "TransactionError";
    }
  }

  // Create a database-specific error boundary
  const dbBoundary = createAsyncErrorBoundary((err) => {
    console.log("DB error transformer called with:", err);

    const message = err instanceof Error ? err.message : String(err);

    // Classify errors based on message patterns
    if (message.includes("connection") || message.includes("connect")) {
      return new ConnectionError(message, "connect");
    }

    if (message.includes("query") || message.includes("SQL")) {
      // Extract the query if available
      const queryMatch = message.match(/query:\s*([^,]+)/i);
      const query = queryMatch ? queryMatch[1].trim() : "unknown";

      if (message.includes("duplicate")) {
        return new QueryError("DUPLICATE_KEY", message, query);
      }

      if (message.includes("syntax")) {
        return new QueryError("SYNTAX_ERROR", message, query);
      }

      return new QueryError("QUERY_ERROR", message, query);
    }

    if (
      message.includes("transaction") ||
      message.includes("commit") ||
      message.includes("rollback")
    ) {
      if (message.includes("commit")) {
        return new TransactionError("COMMIT_ERROR", message, "commit");
      }

      if (message.includes("rollback")) {
        return new TransactionError("ROLLBACK_ERROR", message, "rollback");
      }

      return new TransactionError("TRANSACTION_ERROR", message, "transaction");
    }

    // Default to generic database error
    return new DatabaseError(
      "UNKNOWN_ERROR",
      message,
      "unknown",
      err instanceof Error ? err : undefined,
    );
  });

  // Simulated database operations
  class Database {
    async connect(): Promise<void> {
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Uncomment to simulate connection error
      // throw new Error("Failed to connect to database: Connection refused");
    }

    async query(sql: string, _params: any[] = []): Promise<any[]> {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (sql.includes("syntax error")) {
        throw new Error(`SQL syntax error in query: ${sql}`);
      }

      if (sql.includes("duplicate")) {
        throw new Error(`Duplicate key error in query: ${sql}`);
      }

      if (sql.includes("users")) {
        return [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ];
      }

      return [];
    }

    async beginTransaction(): Promise<Transaction> {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return new Transaction(this);
    }
  }

  class Transaction {
    private _db: Database;

    constructor(db: Database) {
      this._db = db;
    }

    async query(sql: string, params: any[] = []): Promise<any[]> {
      return this._db.query(sql, params);
    }

    async commit(): Promise<void> {
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (Math.random() < 0.3) {
        throw new Error("Failed to commit transaction: Deadlock detected");
      }
    }

    async rollback(): Promise<void> {
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (Math.random() < 0.1) {
        throw new Error("Failed to rollback transaction: Connection lost");
      }
    }
  }

  // Safe database operations using the boundary
  async function safeConnect(): Promise<Result<Database, DatabaseError>> {
    return dbBoundary(async () => {
      const db = new Database();
      await db.connect();
      return db;
    });
  }

  async function safeQuery(
    db: Database,
    sql: string,
    params: any[] = [],
  ): Promise<Result<any[], DatabaseError>> {
    return dbBoundary(async () => {
      return db.query(sql, params);
    });
  }

  async function safeTransaction<T>(
    db: Database,
    operations: (tx: Transaction) => Promise<T>,
  ): Promise<Result<T, DatabaseError>> {
    return dbBoundary(async () => {
      const tx = await db.beginTransaction();

      try {
        const result = await operations(tx);
        await tx.commit();
        return result;
      } catch (err) {
        await tx.rollback();
        throw err;
      }
    });
  }

  // Use the safe database operations
  console.log("Connecting to database:");
  const dbResult = await safeConnect();

  if (isError(dbResult)) {
    console.log("Failed to connect:", dbResult.error);
    return { connectionError: dbResult };
  }

  const db = dbResult.data;
  console.log("Connected to database successfully");

  // Perform some queries
  console.log("\nExecuting successful query:");
  const usersResult = await safeQuery(db, "SELECT * FROM users");
  console.log("Users query result:", usersResult);

  console.log("\nExecuting query with syntax error:");
  const syntaxErrorResult = await safeQuery(db, "SELECT * FROM users WHERE syntax error");
  console.log("Syntax error result:", syntaxErrorResult);

  console.log("\nExecuting query with duplicate key:");
  const duplicateResult = await safeQuery(db, "INSERT INTO users (id) VALUES (1) -- duplicate");
  console.log("Duplicate key result:", duplicateResult);

  // Perform a transaction
  console.log("\nExecuting transaction:");
  const transactionResult = await safeTransaction(db, async (tx) => {
    const users = await tx.query("SELECT * FROM users");
    await tx.query("UPDATE users SET active = true");
    return users.length;
  });

  console.log("Transaction result:", transactionResult);

  return {
    dbResult,
    usersResult,
    syntaxErrorResult,
    duplicateResult,
    transactionResult,
  };
}

/**
 * Example 4: File System Operation Error Handling
 *
 * Shows how to use createAsyncErrorBoundary for file system operations
 */
export async function fileSystemErrorHandlingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 4: File System Operation Error Handling");

  // Define file system error types
  class FileSystemError extends Error {
    constructor(
      public code: string,
      message: string,
      public path?: string,
    ) {
      super(message);
      this.name = "FileSystemError";
    }
  }

  class FileNotFoundError extends FileSystemError {
    constructor(path: string) {
      super("ENOENT", `File not found: ${path}`, path);
      this.name = "FileNotFoundError";
    }
  }

  class PermissionError extends FileSystemError {
    constructor(path: string) {
      super("EACCES", `Permission denied: ${path}`, path);
      this.name = "PermissionError";
    }
  }

  class IOError extends FileSystemError {
    constructor(message: string, path?: string) {
      super("EIO", message, path);
      this.name = "IOError";
    }
  }

  // Create a file system-specific error boundary
  const fsBoundary = createAsyncErrorBoundary((err) => {
    console.log("FS error transformer called with:", err);

    const message = err instanceof Error ? err.message : String(err);
    const path =
      typeof err === "object" && err !== null && "path" in err
        ? String((err as any).path)
        : extractPathFromMessage(message);

    // Classify errors based on error code or message patterns
    if (
      message.includes("ENOENT") ||
      message.includes("not found") ||
      message.includes("no such file")
    ) {
      return new FileNotFoundError(path || "unknown");
    }

    if (
      message.includes("EACCES") ||
      message.includes("permission") ||
      message.includes("access denied")
    ) {
      return new PermissionError(path || "unknown");
    }

    if (message.includes("EIO") || message.includes("I/O") || message.includes("input/output")) {
      return new IOError(message, path);
    }

    // Default to generic file system error
    return new FileSystemError("UNKNOWN", message, path);
  });

  // Helper to extract path from error messages
  function extractPathFromMessage(message: string): string | undefined {
    const pathMatches = message.match(/'([^']+)'/) || message.match(/"([^"]+)"/);
    return pathMatches ? pathMatches[1] : undefined;
  }

  // Simulated file system
  class FileSystem {
    private _files: Map<string, string> = new Map();
    private _protectedFiles: Set<string> = new Set();

    constructor() {
      // Initialize with some files
      this._files.set("/config.json", '{"setting1": "value1", "setting2": "value2"}');
      this._files.set("/data.csv", "id,name,age\n1,Alice,30\n2,Bob,25");
      this._files.set("/system/log.txt", "System log entries");

      // Set some files as protected (permission denied)
      this._protectedFiles.add("/system/log.txt");
    }

    async readFile(path: string): Promise<string> {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!this._files.has(path)) {
        throw {
          code: "ENOENT",
          message: `ENOENT: no such file or directory '${path}'`,
          path,
        };
      }

      if (this._protectedFiles.has(path)) {
        throw {
          code: "EACCES",
          message: `EACCES: permission denied '${path}'`,
          path,
        };
      }

      if (path.includes("corrupted")) {
        throw {
          code: "EIO",
          message: `EIO: i/o error reading '${path}'`,
          path,
        };
      }

      return this._files.get(path)!;
    }

    async writeFile(path: string, content: string): Promise<void> {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (this._protectedFiles.has(path)) {
        throw {
          code: "EACCES",
          message: `EACCES: permission denied '${path}'`,
          path,
        };
      }

      if (path.includes("readonly")) {
        throw {
          code: "EROFS",
          message: `EROFS: read-only file system, cannot write to '${path}'`,
          path,
        };
      }

      this._files.set(path, content);
    }

    async exists(path: string): Promise<boolean> {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return this._files.has(path);
    }
  }

  // Safe file system operations using the boundary
  async function safeReadFile(
    fs: FileSystem,
    path: string,
  ): Promise<Result<string, FileSystemError>> {
    return fsBoundary(async () => {
      return fs.readFile(path);
    });
  }

  async function safeWriteFile(
    fs: FileSystem,
    path: string,
    content: string,
  ): Promise<Result<void, FileSystemError>> {
    return fsBoundary(async () => {
      await fs.writeFile(path, content);
    });
  }

  async function safeReadJson<T>(fs: FileSystem, path: string): Promise<Result<T, Error>> {
    return fsBoundary(async () => {
      const content = await fs.readFile(path);
      try {
        return JSON.parse(content);
      } catch (err) {
        throw new Error(`Failed to parse JSON from ${path}: ${err}`);
      }
    });
  }

  // Create a file system instance
  const fs = new FileSystem();

  // Perform some file operations
  console.log("Reading existing file:");
  const configResult = await safeReadFile(fs, "/config.json");
  console.log("Config file result:", configResult);

  console.log("\nParsing JSON file:");
  const jsonResult = await safeReadJson(fs, "/config.json");
  console.log("JSON parsing result:", jsonResult);

  console.log("\nReading non-existent file:");
  const missingResult = await safeReadFile(fs, "/missing.txt");
  console.log("Missing file result:", missingResult);

  console.log("\nReading protected file:");
  const protectedResult = await safeReadFile(fs, "/system/log.txt");
  console.log("Protected file result:", protectedResult);

  console.log("\nWriting to new file:");
  const writeResult = await safeWriteFile(fs, "/newfile.txt", "This is a new file");
  console.log("Write result:", writeResult);

  console.log("\nWriting to protected file:");
  const writeProtectedResult = await safeWriteFile(
    fs,
    "/system/log.txt",
    "Trying to modify system log",
  );
  console.log("Write to protected file result:", writeProtectedResult);

  // Error handling with type checking
  function handleFileError(result: Result<string, FileSystemError>): string {
    if (isSuccess(result)) {
      return `File content: ${result.data.substring(0, 50)}${result.data.length > 50 ? "..." : ""}`;
    }

    const error = result.error;

    if (error instanceof FileNotFoundError) {
      return `The file ${error.path} does not exist. Please check the path and try again.`;
    }

    if (error instanceof PermissionError) {
      return `You do not have permission to access ${error.path}. Please check your permissions.`;
    }

    if (error instanceof IOError) {
      return `I/O error occurred${error.path ? ` with ${error.path}` : ""}. The file might be corrupted.`;
    }

    return `File system error: ${error.message}`;
  }

  console.log("\nError handling examples:");
  console.log("Config file:", handleFileError(configResult));
  console.log("Missing file:", handleFileError(missingResult));
  console.log("Protected file:", handleFileError(protectedResult));

  return {
    configResult,
    jsonResult,
    missingResult,
    protectedResult,
    writeResult,
    writeProtectedResult,
  };
}

// Run all examples
async function _runCreateAsyncErrorBoundaryExamples() {
  await basicAsyncErrorBoundaryExamples();
  await apiRequestErrorHandlingExample();
  await databaseErrorHandlingExample();
  await fileSystemErrorHandlingExample();
}

// Uncomment to run
// runCreateAsyncErrorBoundaryExamples();
