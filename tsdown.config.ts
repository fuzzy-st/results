import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    main: "src/main.ts",
    "lib/core/index": "src/lib/core/index.ts",
    "lib/transformers/index": "src/lib/transformers/index.ts",
    "lib/async/index": "src/lib/async/index.ts",
    types: "src/types.ts",
  },
  format: ["esm"],
  //  outExtension() {
  //   return {
  //     js: '.mjs',
  //   };
  // },
  outExtensions: () => ({
    js: ".mjs",
  }),
  name: "@fuzzy-street/results",
  dts: true,
  sourcemap: true,
  clean: true,
  platform: "neutral",
  // splitting: true,
  treeshake: true,
  target: false,
});
