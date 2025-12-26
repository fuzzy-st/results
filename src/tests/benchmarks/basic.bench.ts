// integrated-benchmarks.ts
import {
  compareBenchmarks,
  generateReport,
  ReportFormat,
  runAdaptiveBenchmark,
  runBenchmark,
  runMonitoredBenchmark,
  saveReport,
} from "@fuzzy-street/benchmarks";
import { error } from "~/lib/core/error";
import { isSuccess } from "~/lib/core/isSuccess";
import { success } from "~/lib/core/success";
import type { Result } from "~/types";

// ----------------------------------------------------------------
// SECTION 1: Function Call Overhead (from functions.ts)
// ----------------------------------------------------------------

function benchmarkFunctionCallOverhead() {
  console.log("Running Function Call Overhead Benchmark...");

  // Direct function
  function directCall(x: number) {
    return x * 2;
  }

  // Result pattern function
  function resultPatternCall(x: number): Result<number, Error> {
    return x > 0 ? success(x * 2) : error(new Error("Invalid number"));
  }

  // Nested function calls with direct method
  function nestedDirectCalls(x: number) {
    const step1 = directCall(x);
    const step2 = directCall(step1);
    const step3 = directCall(step2);
    return step3;
  }

  // Nested function calls with Result pattern
  function nestedResultCalls(x: number): Result<number, Error> {
    const result1 = resultPatternCall(x);
    if (!isSuccess(result1)) return result1;

    const result2 = resultPatternCall(result1.data);
    if (!isSuccess(result2)) return result2;

    const result3 = resultPatternCall(result2.data);
    return result3;
  }

  // Compare performance using the new library
  const comparison = compareBenchmarks(
    { name: "Direct Function Calls", fn: () => nestedDirectCalls(5) },
    { name: "Result Pattern Calls", fn: () => nestedResultCalls(5) },
    {
      iterations: 1_000_000,
      warmupRuns: 3,
      gcBetweenRuns: true,
    },
  );

  console.log("Function Call Overhead Results:");
  console.log(
    `${comparison.comparison.fasterName} is ${comparison.comparison.percentFaster.toFixed(2)}% faster`,
  );
  console.log(`Direct Calls: ${comparison.resultA.operationsPerSecond.toFixed(2)} ops/sec`);
  console.log(`Result Pattern Calls: ${comparison.resultB.operationsPerSecond.toFixed(2)} ops/sec`);

  return comparison;
}

// ----------------------------------------------------------------
// SECTION 2: Deep Nesting Benchmark
// ----------------------------------------------------------------

function benchmarkDeepNesting() {
  console.log("Running Deep Nesting Benchmark...");

  // Deeply nested direct calls - this is a simple recursive function
  function deepDirectNesting(depth: number, x: number): number {
    if (depth === 0) return x;
    return deepDirectNesting(depth - 1, x * 2);
  }

  // Deeply nested Result pattern calls
  function deepResultNesting(depth: number, x: number): Result<number, Error> {
    if (depth === 0) return success(x);

    const result = deepResultNesting(depth - 1, x * 2);
    return !isSuccess(result) ? result : success(result.data);
  }

  // Compare performance using the new library
  const comparison = compareBenchmarks(
    { name: "Deep Direct Nesting", fn: () => deepDirectNesting(10, 1) },
    { name: "Deep Result Nesting", fn: () => deepResultNesting(10, 1) },
    {
      iterations: 100_000,
      warmupRuns: 3,
      gcBetweenRuns: true,
    },
  );

  console.log("Deep Nesting Benchmark Results:");
  console.log(
    `${comparison.comparison.fasterName} is ${comparison.comparison.percentFaster.toFixed(2)}% faster`,
  );
  console.log(`Direct Nesting: ${comparison.resultA.operationsPerSecond.toFixed(2)} ops/sec`);
  console.log(
    `Result Pattern Nesting: ${comparison.resultB.operationsPerSecond.toFixed(2)} ops/sec`,
  );

  return comparison;
}

// ----------------------------------------------------------------
// SECTION 3: Error Handling Overhead
// ----------------------------------------------------------------

function benchmarkErrorHandlingOverhead() {
  console.log("Running Error Handling Overhead Benchmark...");

  // Direct error throwing
  function directErrorHandling(shouldThrow: boolean) {
    try {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return 42;
    } catch (_error) {
      return -1;
    }
  }

  // Result pattern error handling
  function resultErrorHandling(shouldFail: boolean): Result<number, Error> {
    return shouldFail ? error(new Error("Test error")) : success(42);
  }

  // Using the adaptive benchmark to find optimal iteration count
  console.log("Calibrating benchmark...");
  const calibration = runAdaptiveBenchmark(
    () => {
      // Alternating between success and error
      for (let i = 0; i < 100; i++) {
        directErrorHandling(i % 2 === 0);
        resultErrorHandling(i % 2 === 0);
      }
    },
    {
      minIterations: 100,
      maxIterations: 1_000_000,
      targetRSD: 2.0,
      maxTime: 5000, // 5 seconds max
    },
  );

  console.log(`Optimal iterations: ${calibration.calibration.finalIterations}`);

  // Now run the actual comparison with the calibrated iteration count
  const iterations = calibration.calibration.finalIterations;

  const directResult = runBenchmark(
    () => {
      for (let i = 0; i < 1000; i++) {
        directErrorHandling(i % 2 === 0);
      }
    },
    { iterations, warmupRuns: 3, gcBetweenRuns: true },
  );

  const resultPatternResult = runBenchmark(
    () => {
      for (let i = 0; i < 1000; i++) {
        const result = resultErrorHandling(i % 2 === 0);
        if (!isSuccess(result)) {
          // Handle error
        }
      }
    },
    { iterations, warmupRuns: 3, gcBetweenRuns: true },
  );

  const percentDifference = (resultPatternResult.duration / directResult.duration - 1) * 100;

  console.log("Error Handling Overhead Results:");
  console.log(`Direct error handling: ${directResult.operationsPerSecond.toFixed(2)} ops/sec`);
  console.log(
    `Result pattern error handling: ${resultPatternResult.operationsPerSecond.toFixed(2)} ops/sec`,
  );
  console.log(
    `Result pattern is ${percentDifference.toFixed(2)}% slower than direct error handling`,
  );

  return { directResult, resultPatternResult, percentDifference };
}

// ----------------------------------------------------------------
// SECTION 4: Realistic User Service Benchmark
// ----------------------------------------------------------------

interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  createUser(userData: Partial<User>): Result<User, Error> {
    if (!userData.name || userData.name.length < 2) {
      return error(new Error("Invalid name"));
    }

    if (!userData.email || !this.validateEmail(userData.email)) {
      return error(new Error("Invalid email"));
    }

    const user: User = {
      id: Math.floor(Math.random() * 1000000),
      name: userData.name,
      email: userData.email,
    };

    return success(user);
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

async function benchmarkUserService() {
  console.log("Running User Service Benchmark with Hardware Monitoring...");

  const userService = new UserService();

  // Mix of valid and invalid user data
  const testCases = [
    { name: "John Doe", email: "john@example.com" }, // Valid
    { name: "", email: "invalid-email" }, // Invalid
    { name: "A", email: "short@example.com" }, // Partially invalid
    { name: "Alice Smith", email: "alice@example.com" }, // Valid
  ];

  // Use the monitored benchmark to track system resources
  const result = await runMonitoredBenchmark(
    () => {
      let successCount = 0;
      let failureCount = 0;

      // Process all test cases in each iteration
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const result = userService.createUser(testCase);

        if (isSuccess(result)) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      return { successCount, failureCount };
    },
    {
      iterations: 25_000, // 25K iterations * 4 test cases = 100K operations
      warmupRuns: 3,
      monitorCpu: true,
      monitorMemory: true,
      samplingInterval: 100, // 100ms sampling
      detectThermalThrottling: true,
    },
  );

  console.log("User Service Benchmark Results:");
  console.log(`Operations/second: ${result.operationsPerSecond.toFixed(2)} ops/sec`);
  console.log(
    `Average CPU utilization: ${result.hardwareMetrics.summary.cpuUtilization.avg.toFixed(2)}%`,
  );
  console.log(`Memory used: ${(result.memoryDelta.heapUsed / (1024 * 1024)).toFixed(2)} MB`);

  if (result.hardwareMetrics.summary.thermalThrottling) {
    console.warn("Warning: Thermal throttling detected during benchmark!");
  }

  return result;
}

// ----------------------------------------------------------------
// SECTION 5: Memory Investigation
// ----------------------------------------------------------------

function benchmarkMemoryUsage() {
  console.log("Running Memory Usage Benchmark...");

  function createObjects(count: number) {
    const objects = [];
    for (let i = 0; i < count; i++) {
      objects.push({
        id: i,
        data: Math.random().toString(36).substring(7),
      });
    }
    return objects;
  }

  function createResultObjects(count: number) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(
        i % 2 === 0 ? success({ id: i, value: Math.random() }) : error(new Error(`Error ${i}`)),
      );
    }
    return results;
  }

  // Compare memory usage between plain objects and Result objects
  const plainObjectsBenchmark = runBenchmark(() => createObjects(10_000), {
    iterations: 10,
    warmupRuns: 1,
    gcBetweenRuns: true,
    runs: 5,
  });

  const resultObjectsBenchmark = runBenchmark(() => createResultObjects(10_000), {
    iterations: 10,
    warmupRuns: 1,
    gcBetweenRuns: true,
    runs: 5,
  });

  const plainObjectMemoryPerItem =
    plainObjectsBenchmark.memoryDelta.heapUsed / (10_000 * plainObjectsBenchmark.iterations);
  const resultObjectMemoryPerItem =
    resultObjectsBenchmark.memoryDelta.heapUsed / (10_000 * resultObjectsBenchmark.iterations);

  console.log("Memory Usage Benchmark Results:");
  console.log(`Plain object memory per item: ${plainObjectMemoryPerItem.toFixed(2)} bytes`);
  console.log(`Result object memory per item: ${resultObjectMemoryPerItem.toFixed(2)} bytes`);
  console.log(
    `Result objects use ${(resultObjectMemoryPerItem / plainObjectMemoryPerItem - 1) * 100}% more memory`,
  );

  return { plainObjectsBenchmark, resultObjectsBenchmark };
}

// ----------------------------------------------------------------
// SECTION 6: Run All Benchmarks & Generate Report
// ----------------------------------------------------------------

export async function runAllBenchmarks() {
  console.log("Starting comprehensive benchmark suite...");

  const functionCallResults = benchmarkFunctionCallOverhead();
  const deepNestingResults = benchmarkDeepNesting();
  const errorHandlingResults = benchmarkErrorHandlingOverhead();
  const userServiceResults = await benchmarkUserService();
  const memoryUsageResults = benchmarkMemoryUsage();
  const reporters = [
    {
      name: "Function Call Overhead: Direct Function Calling",
      results: functionCallResults.resultA,
    },
    { name: "Function Call Overhead: Result Pattern", results: functionCallResults.resultB },
    { name: "Deep Nesting: Direct Function Calling", results: deepNestingResults.resultA },
    { name: "Deep Nesting: Result Pattern", results: deepNestingResults.resultB },
    { name: "Error Handling: Direct Result", results: errorHandlingResults.directResult },
    { name: "Error Handling: Result Pattern", results: errorHandlingResults.resultPatternResult },
    { name: "Memory Usage: Plain Objects", results: memoryUsageResults.plainObjectsBenchmark },
    { name: "Memory Usage: Result Objects", results: memoryUsageResults.resultObjectsBenchmark },
  ];
  // Generate an HTML report with all benchmark results
  // Save the report
  saveReport(
    generateReport(reporters, {
      format: ReportFormat.HTML,
      title: "Result Pattern Performance Analysis",
      includeSystemInfo: true,
      colorOutput: true,
      includeSummary: true,
    }),
    {
      format: ReportFormat.HTML,
      outputPath: "./benchmark-reports/result-pattern-analysis",
    },
  );

  console.log(
    "Benchmark suite completed! Report saved to ./benchmark-reports/result-pattern-analysis.html",
  );

  // Also save as JSON for potential future analysis
  saveReport(generateReport(reporters, { format: ReportFormat.JSON }), {
    format: ReportFormat.JSON,
    outputPath: "./benchmark-reports/result-pattern-analysis.json",
  });

  return {
    functionCallResults,
    deepNestingResults,
    errorHandlingResults,
    userServiceResults,
    memoryUsageResults,
  };
}

runAllBenchmarks()
  .then(() => {
    console.log("All benchmarks completed successfully!");
  })
  .catch((error) => {
    console.error("Error running benchmarks:", error);
  });
