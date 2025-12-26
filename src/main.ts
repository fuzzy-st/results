// ============================================================================
// CORE EXPORTS
// ============================================================================
// Essential Result creation and type checking functions

// Async utilities
export { asyncAll } from "./lib/async/asyncAll";
export { asyncChain } from "./lib/async/asyncChain";
// Async transformations
export { asyncMap } from "./lib/async/asyncMap";
export { asyncMapError } from "./lib/async/asyncMapError";
export { asyncPipe } from "./lib/async/asyncPipe";
export { createAsyncErrorBoundary } from "./lib/async/createAsyncErrorBoundary";
export { fromAsync } from "./lib/async/fromAsync";
// ============================================================================
// ASYNC EXPORTS
// ============================================================================
// Promise/async integration utilities
export { fromPromise } from "./lib/async/fromPromise";
export { withFinally } from "./lib/async/withFinally";
export { error } from "./lib/core/error";
export { isError } from "./lib/core/isError";
export { isResult } from "./lib/core/isResult";
export { isSuccess } from "./lib/core/isSuccess";
export { match } from "./lib/core/match";
export { success } from "./lib/core/success";
export { unwrap } from "./lib/core/unwrap";
export { unwrapOr } from "./lib/core/unwrapOr";
export { chain } from "./lib/transformers/chain";
export { createErrorBoundary } from "./lib/transformers/createErrorBoundary";
// ============================================================================
// TRANSFORMER EXPORTS
// ============================================================================
// Synchronous transformation utilities
export { map } from "./lib/transformers/map";
export { mapError } from "./lib/transformers/mapError";
export { pipe } from "./lib/transformers/pipe";
// Side-effect utilities
export { tap } from "./lib/transformers/tap";
export { tapError } from "./lib/transformers/tapError";
export { tapSuccess } from "./lib/transformers/tapSuccess";

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type { Result } from "./types";

// ============================================================================
// NAMESPACE EXPORTS (Optional - for organized imports)
// ============================================================================

export * as Async from "./lib/async/index";
// Core namespace
export * as Core from "./lib/core/index";
export * as Transformers from "./lib/transformers/index";
