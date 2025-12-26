// Core Result creation functions

// Re-export types for convenience
export type { Result } from "../../types";
export { error } from "./error";
export { isError } from "./isError";
// Type guards and checking functions
export { isResult } from "./isResult";
export { isSuccess } from "./isSuccess";

// Pattern matching and unwrapping
export { match } from "./match";
export { success } from "./success";
export { unwrap } from "./unwrap";
export { unwrapOr } from "./unwrapOr";
