// Core Result creation functions
export { success } from './success';
export { error } from './error';

// Type guards and checking functions
export { isResult } from './isResult';
export { isSuccess } from './isSuccess';
export { isError } from './isError';

// Pattern matching and unwrapping
export { match } from './match';
export { unwrap } from './unwrap';
export { unwrapOr } from './unwrapOr';

// Re-export types for convenience
export type { Result } from '../../types';