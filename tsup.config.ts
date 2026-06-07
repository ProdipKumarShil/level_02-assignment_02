// import { defineConfig } from 'tsup'

// export default defineConfig({
//   name: 'tsup',
//   target: 'node18',
//   dts: {
//     resolve: true,
//     // build types for `src/index.ts` only
//     // otherwise `Options` will not be exported by `tsup`, not sure how this happens, probably a bug in rollup-plugin-dts
//     entry: './src/index.ts',
//   },
// })

import { defineConfig } from "tsup";

export default defineConfig({
 entry: ["src/server.ts"],
 format: ["esm"], // Keep this as ESM => format: ["esm", "cjs"]
 target: "esnext",
 outDir: "dist",
 clean: true,
 bundle: true,
 splitting: false,
 sourcemap: true,
 // Add this banner to shim require() for CJS dependencies
 banner: {
  js: `
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  `,
 },
});