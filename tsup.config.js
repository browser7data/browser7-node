import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';

// Read package.json for version injection
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

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
  define: {
    // Inject package version at build time
    __PACKAGE_VERSION__: JSON.stringify(packageJson.version)
  },
  esbuildOptions(options, context) {
    // Fix CJS default export to work with require()
    if (context.format === 'cjs') {
      options.footer = {
        js: 'if (module.exports.default) { Object.assign(module.exports.default, module.exports); module.exports = module.exports.default; }'
      };
    }
  }
});
