import { defineConfig } from "tsup";

export default defineConfig({
  format: ["cjs", "esm"],
  entry: ["src/index.ts"],
  minify: true,
  splitting: true,
  dts: true,
  sourcemap: true,
});
