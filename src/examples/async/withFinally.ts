/**
 * Examples demonstrating the usage of the withFinally method
 * from the Result pattern library.
 */

import { withFinally } from "~/lib/async/withFinally";
import { error } from "~/lib/core/error";
import { isError } from "~/lib/core/isError";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

/**
 * Example 1: Basic withFinally Usage
 *
 * Demonstrates the basic usage of withFinally for resource cleanup
 */
export async function basicWithFinallyExamples() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 1: Basic withFinally Usage");

  // Simulate a resource that needs to be closed after use
  class Resource {
    private _name: string;
    private _isOpen = false;

    constructor(name: string) {
      this._name = name;
    }

    async open(): Promise<void> {
      console.log(`Opening resource: ${this._name}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      this._isOpen = true;
    }

    async close(): Promise<void> {
      console.log(`Closing resource: ${this._name}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      this._isOpen = false;
    }

    async use(): Promise<Result<string, Error>> {
      if (!this._isOpen) {
        return error(new Error(`Resource ${this._name} is not open`));
      }

      console.log(`Using resource: ${this._name}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      return success(`Data from ${this._name}`);
    }

    isOpen(): boolean {
      return this._isOpen;
    }
  }

  // Successful resource usage
  console.log("Successful resource usage:");
  const resource = new Resource("DB Connection");
  await resource.open();

  const result = await withFinally(resource.use(), async () => {
    await resource.close();
    console.log(`Resource state after closing: ${resource.isOpen() ? "open" : "closed"}`);
  });

  console.log("Resource usage result:", result);

  // Failed resource usage
  console.log("\nFailed resource usage:");
  const unopenedResource = new Resource("Unopened Connection");

  const failedResult = await withFinally(unopenedResource.use(), async () => {
    // This will still run even though the operation failed
    console.log("Cleanup still runs after operation failure");
    if (unopenedResource.isOpen()) {
      await unopenedResource.close();
    }
  });

  console.log("Failed resource usage result:", failedResult);

  return { result, failedResult };
}

/**
 * Example 2: Database Transactions
 *
 * Shows how to use withFinally for managing database transactions
 */
export async function databaseTransactionExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 2: Database Transactions");

  // Simulate a database connection
  class Database {
    private _connected = false;

    async connect(): Promise<void> {
      console.log("Connecting to database...");
      await new Promise((resolve) => setTimeout(resolve, 100));
      this._connected = true;
      console.log("Connected to database");
    }

    async disconnect(): Promise<void> {
      console.log("Disconnecting from database...");
      await new Promise((resolve) => setTimeout(resolve, 100));
      this._connected = false;
      console.log("Disconnected from database");
    }

    isConnected(): boolean {
      return this._connected;
    }

    async beginTransaction(): Promise<Transaction> {
      if (!this._connected) {
        throw new Error("Database not connected");
      }

      console.log("Beginning transaction");
      await new Promise((resolve) => setTimeout(resolve, 50));
      return new Transaction(this);
    }
  }

  class Transaction {
    private _active = true;
    private _queryCount = 0;

    constructor(db: Database) {
      this._db = db;
    }

    async commit(): Promise<void> {
      console.log("Committing transaction");
      await new Promise((resolve) => setTimeout(resolve, 100));
      this._active = false;
    }

    async rollback(): Promise<void> {
      console.log("Rolling back transaction");
      await new Promise((resolve) => setTimeout(resolve, 100));
      this._active = false;
    }

    isActive(): boolean {
      return this._active;
    }

    async execute(query: string): Promise<Result<any, Error>> {
      if (!this._active) {
        return error(new Error("Transaction is not active"));
      }

      console.log(`Executing query: ${query}`);
      await new Promise((resolve) => setTimeout(resolve, 50));
      this._queryCount++;

      // Simulate a failure for specific queries
      if (query.includes("failure")) {
        return error(new Error("Query execution failed"));
      }

      return success({
        rows: [{ id: 1, name: "Test" }],
        count: this._queryCount,
      });
    }
  }

  // Function to safely run a transaction
  async function runTransaction<T>(
    db: Database,
    operation: (tx: Transaction) => Promise<Result<T, Error>>,
  ): Promise<Result<T, Error>> {
    // Check connection
    if (!db.isConnected()) {
      return error(new Error("Database not connected"));
    }

    // Begin transaction
    let tx: Transaction;
    try {
      tx = await db.beginTransaction();
    } catch (err) {
      return error(err instanceof Error ? err : new Error(String(err)));
    }

    // Run operation with finally block to ensure transaction is ended
    return withFinally(operation(tx), async () => {
      if (tx.isActive()) {
        // If transaction is still active, roll it back
        console.log("Transaction still active in finally block, rolling back");
        await tx.rollback();
      }
    });
  }

  // Simple transaction example
  async function simpleTransactionExample(
    db: Database,
    shouldFail: boolean,
  ): Promise<Result<any, Error>> {
    return runTransaction(db, async (tx) => {
      // First query
      const query1Result = await tx.execute("SELECT * FROM users");
      if (isError(query1Result)) {
        // No need to call rollback - the finally block will handle it
        return query1Result;
      }

      // Second query
      const query2Result = await tx.execute(
        shouldFail ? "UPDATE users SET status = 'failure'" : "UPDATE users SET status = 'active'",
      );
      if (isError(query2Result)) {
        return query2Result;
      }

      // Everything succeeded, commit the transaction
      await tx.commit();
      return success({
        message: "Transaction completed successfully",
        results: [query1Result.data, query2Result.data],
      });
    });
  }

  // Set up the database
  const db = new Database();
  await db.connect();

  // Run successful transaction
  console.log("\nRunning successful transaction:");
  const successfulTransaction = await simpleTransactionExample(db, false);
  console.log("Transaction result:", successfulTransaction);

  // Run failing transaction
  console.log("\nRunning failing transaction:");
  const failingTransaction = await simpleTransactionExample(db, true);
  console.log("Transaction result:", failingTransaction);

  // Clean up
  await withFinally(Promise.resolve(success("cleanup")), async () => {
    if (db.isConnected()) {
      await db.disconnect();
    }
  });

  return { successfulTransaction, failingTransaction };
}

/**
 * Example 3: File Processing with Cleanup
 *
 * Demonstrates using withFinally for file operations
 */
export async function fileProcessingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 3: File Processing with Cleanup");

  // Simulate a file system
  class FileSystem {
    private _files: Map<string, string> = new Map();
    private _openHandles: Set<string> = new Set();

    constructor() {
      // Initialize with some files
      this._files.set("config.json", '{"setting1": "value1", "setting2": "value2"}');
      this._files.set("data.csv", "id,name,age\n1,Alice,30\n2,Bob,25\n3,Charlie,35");
      this._files.set("log.txt", "Line 1\nLine 2\nLine 3");
    }

    async openFile(path: string): Promise<Result<FileHandle, Error>> {
      console.log(`Opening file: ${path}`);
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (!this._files.has(path)) {
        return error(new Error(`File not found: ${path}`));
      }

      this._openHandles.add(path);
      return success(new FileHandle(this, path));
    }

    getContent(path: string): string | undefined {
      return this._files.get(path);
    }

    async writeContent(path: string, content: string): Promise<void> {
      console.log(`Writing to file: ${path}`);
      await new Promise((resolve) => setTimeout(resolve, 50));
      this._files.set(path, content);
    }

    closeHandle(path: string): void {
      console.log(`Closing file handle: ${path}`);
      this._openHandles.delete(path);
    }

    getOpenHandleCount(): number {
      return this._openHandles.size;
    }
  }

  class FileHandle {
    private _fs: FileSystem;
    private _path: string;
    private _closed = false;

    constructor(fs: FileSystem, path: string) {
      this._fs = fs;
      this._path = path;
    }

    async read(): Promise<Result<string, Error>> {
      if (this._closed) {
        return error(new Error("File handle is closed"));
      }

      console.log(`Reading from file: ${this._path}`);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const content = this._fs.getContent(this._path);
      if (content === undefined) {
        return error(new Error(`Cannot read file: ${this._path}`));
      }

      return success(content);
    }

    async write(content: string): Promise<Result<void, Error>> {
      if (this._closed) {
        return error(new Error("File handle is closed"));
      }

      try {
        await this._fs.writeContent(this._path, content);
        return success(undefined);
      } catch (err) {
        return error(err instanceof Error ? err : new Error(String(err)));
      }
    }

    async close(): Promise<void> {
      if (!this._closed) {
        this._fs.closeHandle(this._path);
        this._closed = true;
      }
    }

    isClosed(): boolean {
      return this._closed;
    }

    getPath(): string {
      return this._path;
    }
  }

  // Function to safely process a file
  async function processFile<T>(
    fs: FileSystem,
    path: string,
    processor: (content: string) => Result<T, Error>,
  ): Promise<Result<T, Error>> {
    const handleResult = await fs.openFile(path);

    if (isError(handleResult)) {
      return handleResult;
    }

    const fileHandle = handleResult.data;

    return withFinally(
      (async () => {
        const contentResult = await fileHandle.read();

        if (isError(contentResult)) {
          return contentResult;
        }

        return processor(contentResult.data);
      })(),
      async () => {
        // Always close the file handle
        await fileHandle.close();
        console.log(`File handle closed: ${fileHandle.isClosed()}`);
      },
    );
  }

  // Create a file system
  const fs = new FileSystem();

  // Example file processors
  function parseJson(content: string): Result<any, Error> {
    try {
      return success(JSON.parse(content));
    } catch (err) {
      return error(new Error(`JSON parsing error: ${err}`));
    }
  }

  function countLines(content: string): Result<number, Error> {
    return success(content.split("\n").length);
  }

  function transformCsv(content: string): Result<any[], Error> {
    try {
      const lines = content.split("\n");
      const headers = lines[0].split(",");

      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        const obj: Record<string, string> = {};

        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = values[j];
        }

        results.push(obj);
      }

      return success(results);
    } catch (err) {
      return error(new Error(`CSV transformation error: ${err}`));
    }
  }

  // Process different files
  console.log("Processing JSON file:");
  const jsonResult = await processFile(fs, "config.json", parseJson);
  console.log("JSON result:", jsonResult);
  console.log("Open file handles:", fs.getOpenHandleCount());

  console.log("\nProcessing CSV file:");
  const csvResult = await processFile(fs, "data.csv", transformCsv);
  console.log("CSV result:", csvResult);
  console.log("Open file handles:", fs.getOpenHandleCount());

  console.log("\nProcessing text file:");
  const textResult = await processFile(fs, "log.txt", countLines);
  console.log("Text result:", textResult);
  console.log("Open file handles:", fs.getOpenHandleCount());

  console.log("\nProcessing non-existent file:");
  const nonExistentResult = await processFile(fs, "missing.txt", countLines);
  console.log("Non-existent file result:", nonExistentResult);
  console.log("Open file handles:", fs.getOpenHandleCount());

  return { jsonResult, csvResult, textResult, nonExistentResult };
}

/**
 * Example 4: API Request Tracking and Metrics
 *
 * Shows how to use withFinally for API request tracking and metrics
 */
export async function apiRequestTrackingExample() {
  console.log(Array.from({ length: 20 }, (_, _i) => "--").join(""));
  console.log("Example 4: API Request Tracking and Metrics");

  // Simulated metrics collector
  class MetricsCollector {
    private _requestCounts: Record<string, number> = {};
    private _errorCounts: Record<string, number> = {};
    private _timings: Record<string, number[]> = {};
    private _activeRequests = 0;

    incrementRequestCount(endpoint: string): void {
      this._requestCounts[endpoint] = (this._requestCounts[endpoint] || 0) + 1;
      this._activeRequests++;
    }

    decrementActiveRequests(): void {
      this._activeRequests--;
    }

    recordError(endpoint: string): void {
      this._errorCounts[endpoint] = (this._errorCounts[endpoint] || 0) + 1;
    }

    recordTiming(endpoint: string, durationMs: number): void {
      if (!this._timings[endpoint]) {
        this._timings[endpoint] = [];
      }
      this._timings[endpoint].push(durationMs);
    }

    getStats(): {
      requests: Record<string, number>;
      errors: Record<string, number>;
      avgTiming: Record<string, number>;
      activeRequests: number;
    } {
      const avgTiming: Record<string, number> = {};

      for (const [endpoint, timings] of Object.entries(this._timings)) {
        if (timings.length > 0) {
          const sum = timings.reduce((a, b) => a + b, 0);
          avgTiming[endpoint] = sum / timings.length;
        }
      }

      return {
        requests: { ...this._requestCounts },
        errors: { ...this._errorCounts },
        avgTiming,
        activeRequests: this._activeRequests,
      };
    }
  }

  // Simulated API client
  class ApiClient {
    private _baseUrl: string;
    private _metrics: MetricsCollector;

    constructor(baseUrl: string, metrics: MetricsCollector) {
      this._baseUrl = baseUrl;
      this._metrics = metrics;
    }

    async get<T>(endpoint: string): Promise<Result<T, Error>> {
      return this._request<T>("GET", endpoint);
    }

    async post<T>(endpoint: string, data: any): Promise<Result<T, Error>> {
      return this._request<T>("POST", endpoint, data);
    }

    private async _request<T>(
      method: string,
      endpoint: string,
      data?: any,
    ): Promise<Result<T, Error>> {
      const url = `${this._baseUrl}${endpoint}`;
      console.log(`${method} ${url}`);

      // Track request
      const startTime = Date.now();
      this._metrics.incrementRequestCount(endpoint);

      // Use withFinally to ensure metrics are recorded
      return withFinally(this._executeRequest<T>(method, url, data), () => {
        const duration = Date.now() - startTime;
        this._metrics.recordTiming(endpoint, duration);
        this._metrics.decrementActiveRequests();
        console.log(`Request completed in ${duration}ms`);
      });
    }

    private async _executeRequest<T>(
      _method: string,
      url: string,
      _data?: any,
    ): Promise<Result<T, Error>> {
      // Simulate API request
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 150));

      // Simulate errors for specific endpoints
      if (url.includes("/error")) {
        this._metrics.recordError(new URL(url).pathname);
        return error(new Error(`API request failed: ${url}`));
      }

      if (url.includes("/users")) {
        return success({
          id: 1,
          name: "John Doe",
          email: "john@example.com",
        } as unknown as T);
      }

      if (url.includes("/posts")) {
        return success([
          { id: 1, title: "First Post", userId: 1 },
          { id: 2, title: "Second Post", userId: 1 },
        ] as unknown as T);
      }

      return success({ success: true } as unknown as T);
    }
  }

  // Create metrics collector and API client
  const metrics = new MetricsCollector();
  const api = new ApiClient("https://api.example.com", metrics);

  // Make some requests
  console.log("Making successful requests:");
  const userResult = await api.get<{ id: number; name: string; email: string }>("/users/1");
  console.log("User result:", userResult);

  const postsResult = await api.get<Array<{ id: number; title: string; userId: number }>>("/posts");
  console.log("Posts result:", postsResult);

  console.log("\nMaking failing request:");
  const errorResult = await api.get("/error");
  console.log("Error result:", errorResult);

  // Show metrics
  console.log("\nAPI Metrics:");
  console.log(metrics.getStats());

  // Make concurrent requests
  console.log("\nMaking concurrent requests:");
  await Promise.all([
    api.get("/users/1"),
    api.get("/users/2"),
    api.get("/posts"),
    api.get("/error"),
  ]);

  console.log("\nUpdated API Metrics:");
  console.log(metrics.getStats());

  return { userResult, postsResult, errorResult, metrics: metrics.getStats() };
}

// Run all examples
async function _runWithFinallyExamples() {
  await basicWithFinallyExamples();
  await databaseTransactionExample();
  await fileProcessingExample();
  await apiRequestTrackingExample();
}

// Uncomment to run
// runWithFinallyExamples();
