/**
 * Examples demonstrating union type handling with multiple error types
 * and discriminated unions
 */

import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";
import { isSuccess } from "~/lib/core/isSuccess";
import { isError } from "~/lib/core/isError";
import { unwrap } from "~/lib/core/unwrap";
import { match } from "~/lib/core/match";
import type { Result } from "~/types";

/**
 * Example 1: Multiple Error Types in API Client
 * 
 * Demonstrates handling different error types that can occur in an API client
 */
export function apiClientWithMultipleErrors() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 1: API Client with Multiple Error Types");

    // Define specific error types
    class NetworkError extends Error {
        constructor(public readonly statusCode: number, public readonly url: string) {
            super(`Network error ${statusCode} at ${url}`);
            this.name = 'NetworkError';
        }
    }

    class ValidationError extends Error {
        constructor(public readonly fields: Record<string, string>) {
            super('Validation failed');
            this.name = 'ValidationError';
        }
    }

    class AuthenticationError extends Error {
        constructor(public readonly reason: 'expired' | 'invalid' | 'missing') {
            super(`Authentication failed: ${reason}`);
            this.name = 'AuthenticationError';
        }
    }

    // API client that can return different error types
    class ApiClient {
        async fetchUser(userId: string): Promise<Result<{ id: string; name: string; email: string },
            NetworkError | ValidationError | AuthenticationError>> {

            // Simulate different error conditions
            if (!userId) {
                return error(new ValidationError({ userId: 'User ID is required' }));
            }

            if (userId === 'unauthorized') {
                return error(new AuthenticationError('invalid'));
            }

            if (userId === 'not-found') {
                return error(new NetworkError(404, '/api/users/not-found'));
            }

            // Success case
            return success({
                id: userId,
                name: 'John Doe',
                email: 'john@example.com'
            });
        }
    }

    const client = new ApiClient();

    // Handle different error types appropriately
    async function displayUser(userId: string) {
        const result = await client.fetchUser(userId);

        if (isError(result)) {
            // TypeScript knows result.error is NetworkError | ValidationError | AuthenticationError
            if (result.error instanceof NetworkError) {
                console.log(`Network error: ${result.error.statusCode} - ${result.error.url}`);
                return `Unable to fetch user. Server returned ${result.error.statusCode}`;
            } else if (result.error instanceof ValidationError) {
                console.log('Validation errors:', result.error.fields);
                return `Invalid input: ${Object.entries(result.error.fields).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
            } else if (result.error instanceof AuthenticationError) {
                console.log(`Auth error: ${result.error.reason}`);
                return 'Please log in again';
            }
        }

        if (isSuccess(result)) {
            console.log('User fetched successfully:', result.data);
            return `User: ${result.data.name} (${result.data.email})`;
        }
    }

    // Test different scenarios
    console.log("\nTesting validation error:");
    displayUser('');

    console.log("\nTesting auth error:");
    displayUser('unauthorized');

    console.log("\nTesting network error:");
    displayUser('not-found');

    console.log("\nTesting success:");
    displayUser('123');

    return { client, displayUser };
}

/**
 * Example 2: State Machine with Discriminated Unions
 * 
 * Demonstrates using discriminated unions for state management
 */
export function stateMachineExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 2: State Machine with Discriminated Unions");

    // Define states as discriminated union
    type AppState =
        | { status: 'idle' }
        | { status: 'loading'; progress: number }
        | { status: 'success'; data: string; timestamp: Date }
        | { status: 'error'; message: string; retryCount: number };

    class StateMachine {
        state: Result<AppState, never>;

        constructor() {
            this.state = success({ status: 'idle' as const });
        }

        startLoading() {
            this.state = success({ status: 'loading' as const, progress: 0 });
        }

        updateProgress(progress: number) {
            this.state = success({ status: 'loading' as const, progress });
        }

        setSuccess(data: string) {
            this.state = success({
                status: 'success' as const,
                data,
                timestamp: new Date()
            });
        }

        setError(message: string, retryCount: number = 0) {
            this.state = success({
                status: 'error' as const,
                message,
                retryCount
            });
        }

        getState(): AppState {
            return unwrap(this.state);
        }

        render(): string {
            const state = this.getState();

            // TypeScript properly narrows based on status
            switch (state.status) {
                case 'idle':
                    return 'Ready to start';
                case 'loading':
                    return `Loading... ${state.progress}%`;
                case 'success':
                    return `Success: ${state.data} (at ${state.timestamp.toISOString()})`;
                case 'error':
                    return `Error: ${state.message} (retry count: ${state.retryCount})`;
            }
        }
    }

    const machine = new StateMachine();
    console.log('Initial state:', machine.render());

    machine.startLoading();
    console.log('After start loading:', machine.render());

    machine.updateProgress(50);
    console.log('Progress update:', machine.render());

    machine.setSuccess('Data loaded successfully');
    console.log('After success:', machine.render());

    machine.setError('Network timeout', 1);
    console.log('After error:', machine.render());

    return { machine };
}

/**
 * Example 3: Payment Processing with Multiple Result Types
 * 
 * Demonstrates handling different payment outcomes
 */
export function paymentProcessingExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 3: Payment Processing with Multiple Result Types");

    // Payment errors
    class InsufficientFundsError extends Error {
        constructor(public readonly available: number, public readonly required: number) {
            super(`Insufficient funds: ${available} available, ${required} required`);
            this.name = 'InsufficientFundsError';
        }
    }

    class CardDeclinedError extends Error {
        constructor(public readonly reason: string, public readonly code: string) {
            super(`Card declined: ${reason}`);
            this.name = 'CardDeclinedError';
        }
    }

    class FraudDetectedError extends Error {
        constructor(public readonly riskScore: number) {
            super(`Fraud detected: risk score ${riskScore}`);
            this.name = 'FraudDetectedError';
        }
    }

    // Payment outcomes as discriminated union
    type PaymentOutcome =
        | { status: 'approved'; transactionId: string; amount: number }
        | { status: 'pending'; estimatedTime: string }
        | { status: 'requires-verification'; method: '2fa' | 'sms' | 'email' };

    class PaymentProcessor {
        processPayment(
            amount: number,
            method: 'card' | 'bank'
        ): Result<PaymentOutcome, InsufficientFundsError | CardDeclinedError | FraudDetectedError> {
            // Simulate different scenarios
            if (amount > 10000) {
                return error(new FraudDetectedError(0.85));
            }

            if (amount > 5000) {
                return success({
                    status: 'requires-verification' as const,
                    method: '2fa' as const
                });
            }

            if (amount > 1000) {
                return success({
                    status: 'pending' as const,
                    estimatedTime: '2-3 business days'
                });
            }

            if (method === 'card' && amount > 500) {
                return error(new CardDeclinedError('Exceeds daily limit', 'LIMIT_EXCEEDED'));
            }

            if (amount < 0) {
                return error(new InsufficientFundsError(0, Math.abs(amount)));
            }

            // Success case
            return success({
                status: 'approved' as const,
                transactionId: `txn_${Date.now()}`,
                amount
            });
        }
    }

    const processor = new PaymentProcessor();

    function handlePayment(amount: number, method: 'card' | 'bank') {
        console.log(`\nProcessing ${method} payment of $${amount}`);

        const result = processor.processPayment(amount, method);

        // Using match for elegant handling
        const message = match(result, {
            success: (outcome) => {
                switch (outcome.status) {
                    case 'approved':
                        return `✓ Payment approved! Transaction ID: ${outcome.transactionId}`;
                    case 'pending':
                        return `⏳ Payment pending. ETA: ${outcome.estimatedTime}`;
                    case 'requires-verification':
                        return `🔒 Verification required via ${outcome.method.toUpperCase()}`;
                }
            },
            error: (err) => {
                if (err instanceof InsufficientFundsError) {
                    return `❌ Insufficient funds. Available: $${err.available}, Required: $${err.required}`;
                } else if (err instanceof CardDeclinedError) {
                    return `❌ Card declined: ${err.reason} (Code: ${err.code})`;
                } else if (err instanceof FraudDetectedError) {
                    return `🚨 Fraud detected! Risk score: ${err.riskScore}`;
                }
                return '❌ Payment failed';
            }
        });

        console.log(message);
        return message;
    }

    // Test various scenarios
    handlePayment(100, 'card');      // Approved
    handlePayment(600, 'card');      // Card declined (exceeds limit)
    handlePayment(2000, 'bank');     // Pending
    handlePayment(7000, 'card');     // Requires verification
    handlePayment(15000, 'bank');    // Fraud detected
    handlePayment(-50, 'card');      // Insufficient funds

    return { processor, handlePayment };
}

/**
 * Example 4: File Processing with Multiple Format Types
 * 
 * Demonstrates handling different file formats and parsing results
 */
export function fileProcessingExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 4: File Processing with Multiple Formats");

    // Parsed file types
    type ParsedFile =
        | { format: 'json'; data: Record<string, unknown> }
        | { format: 'csv'; rows: string[][]; headers: string[] }
        | { format: 'xml'; tree: { tag: string; children: unknown[] } }
        | { format: 'text'; content: string };

    // Parsing errors
    class InvalidFormatError extends Error {
        constructor(public readonly expected: string, public readonly received: string) {
            super(`Invalid format: expected ${expected}, received ${received}`);
            this.name = 'InvalidFormatError';
        }
    }

    class ParseError extends Error {
        constructor(public readonly line: number, public readonly column: number) {
            super(`Parse error at line ${line}, column ${column}`);
            this.name = 'ParseError';
        }
    }

    class EncodingError extends Error {
        constructor(public readonly encoding: string) {
            super(`Unsupported encoding: ${encoding}`);
            this.name = 'EncodingError';
        }
    }

    class FileParser {
        parseFile(
            content: string,
            extension: string
        ): Result<ParsedFile, InvalidFormatError | ParseError | EncodingError> {
            switch (extension) {
                case 'json':
                    try {
                        const data = JSON.parse(content);
                        return success({ format: 'json' as const, data });
                    } catch {
                        return error(new ParseError(1, 0));
                    }

                case 'csv':
                    const lines = content.split('\n');
                    if (lines.length < 2) {
                        return error(new InvalidFormatError('csv', 'text'));
                    }
                    const headers = lines[0].split(',');
                    const rows = lines.slice(1).map(line => line.split(','));
                    return success({ format: 'csv' as const, rows, headers });

                case 'xml':
                    if (!content.includes('<?xml')) {
                        return error(new InvalidFormatError('xml', 'text'));
                    }
                    return success({
                        format: 'xml' as const,
                        tree: { tag: 'root', children: [] }
                    });

                case 'txt':
                    return success({ format: 'text' as const, content });

                default:
                    return error(new InvalidFormatError('known format', extension));
            }
        }
    }

    const parser = new FileParser();

    function processFile(content: string, filename: string) {
        console.log(`\nProcessing file: ${filename}`);
        const extension = filename.split('.').pop() || '';

        const result = parser.parseFile(content, extension);

        if (isError(result)) {
            if (result.error instanceof ParseError) {
                console.log(`Parse error at ${result.error.line}:${result.error.column}`);
            } else if (result.error instanceof InvalidFormatError) {
                console.log(`Format mismatch: expected ${result.error.expected}, got ${result.error.received}`);
            } else if (result.error instanceof EncodingError) {
                console.log(`Encoding error: ${result.error.encoding} not supported`);
            }
            return null;
        }

        if (isSuccess(result)) {
            const parsed = result.data;

            switch (parsed.format) {
                case 'json':
                    console.log(`JSON file with ${Object.keys(parsed.data).length} keys`);
                    break;
                case 'csv':
                    console.log(`CSV file with ${parsed.headers.length} columns and ${parsed.rows.length} rows`);
                    break;
                case 'xml':
                    console.log(`XML file with root tag: ${parsed.tree.tag}`);
                    break;
                case 'text':
                    console.log(`Text file with ${parsed.content.length} characters`);
                    break;
            }

            return parsed;
        }
    }

    // Test different file types
    processFile('{"name": "test", "value": 123}', 'data.json');
    processFile('name,age,city\nJohn,30,NYC\nJane,25,LA', 'data.csv');
    processFile('<?xml version="1.0"?><root></root>', 'data.xml');
    processFile('Just some plain text content', 'data.txt');
    processFile('invalid content', 'data.unknown');

    return { parser, processFile };
}

// Run all examples
export async function runUnionTypeExamples() {
    apiClientWithMultipleErrors();
    stateMachineExample();
    paymentProcessingExample();
    fileProcessingExample();
}

// Uncomment to run
// runUnionTypeExamples();