// Core transformation functions
export { map } from './map';
export { mapError } from './mapError';
export { chain } from './chain';
export { pipe } from './pipe';

// Error boundary utilities
export { createErrorBoundary } from './createErrorBoundary';

// Side-effect functions (tap utilities)
export { tap } from './tap';
export { tapSuccess } from './tapSuccess';
export { tapError } from './tapError';

// Re-export types for convenience
export type { Result } from '../../types';