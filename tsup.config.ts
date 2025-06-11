import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  name: "@fuzzy-street/results",
  dts: true,
  sourcemap: true,
  clean: true,
  platform: "neutral",
  splitting: true,
  treeshake: true,
});