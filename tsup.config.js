import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm', 'cjs'],
  dts: false, // No TypeScript definitions (pure JS)
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs'
    };
  },
  esbuildOptions(options, context) {
    // Fix CJS default export to work with require()
    if (context.format === 'cjs') {
      options.footer = {
        js: 'module.exports = module.exports.default || module.exports;'
      };
    }
  }
});
