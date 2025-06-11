// ============================================================================
// CORE EXPORTS
// ============================================================================
// Essential Result creation and type checking functions
export { success } from './lib/core/success';
export { error } from './lib/core/error';
export { isResult } from './lib/core/isResult';
export { isSuccess } from './lib/core/isSuccess';
export { isError } from './lib/core/isError';
export { match } from './lib/core/match';
export { unwrap } from './lib/core/unwrap';
export { unwrapOr } from './lib/core/unwrapOr';

// ============================================================================
// TRANSFORMER EXPORTS
// ============================================================================
// Synchronous transformation utilities
export { map } from './lib/transformers/map';
export { mapError } from './lib/transformers/mapError';
export { chain } from './lib/transformers/chain';
export { pipe } from './lib/transformers/pipe';
export { createErrorBoundary } from './lib/transformers/createErrorBoundary';

// Side-effect utilities
export { tap } from './lib/transformers/tap';
export { tapSuccess } from './lib/transformers/tapSuccess';
export { tapError } from './lib/transformers/tapError';

// ============================================================================
// ASYNC EXPORTS
// ============================================================================
// Promise/async integration utilities
export { fromPromise } from './lib/async/fromPromise';
export { fromAsync } from './lib/async/fromAsync';

// Async transformations
export { asyncMap } from './lib/async/asyncMap';
export { asyncMapError } from './lib/async/asyncMapError';
export { asyncChain } from './lib/async/asyncChain';
export { asyncPipe } from './lib/async/asyncPipe';

// Async utilities
export { asyncAll } from './lib/async/asyncAll';
export { withFinally } from './lib/async/withFinally';
export { createAsyncErrorBoundary } from './lib/async/createAsyncErrorBoundary';

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type { Result } from './types';

// ============================================================================
// NAMESPACE EXPORTS (Optional - for organized imports)
// ============================================================================

// Core namespace
export * as Core from './lib/core/index';
export * as Transformers from './lib/transformers/index';
export * as Async from './lib/async/index';