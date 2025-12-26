/**
 * @type {import('@commitlint/types').UserConfig}
 * @see https://commitlint.js.org/reference/configuration.html
 */
import type { UserConfig } from "@commitlint/types";
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-case": [2, "always", "lower-case"],
    "scope-empty": [1, "never"],
    "subject-case": [2, "never", "sentence-case"],
    "body-max-line-length": [1, "always", 1000],
  },
} satisfies UserConfig;
