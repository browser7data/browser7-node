// Test CommonJS require
const Browser7 = require('../dist/index.cjs');

console.log('✓ CJS require successful');
console.log('✓ Browser7 class:', typeof Browser7);
console.log('✓ waitForDelay:', typeof Browser7.waitForDelay);

// Verify error classes are accessible via destructuring
const { Browser7Error, AuthenticationError, ValidationError, RateLimitError, InsufficientBalanceError, RenderError } = require('../dist/index.cjs');

const errorClasses = { Browser7Error, AuthenticationError, ValidationError, RateLimitError, InsufficientBalanceError, RenderError };
for (const [name, cls] of Object.entries(errorClasses)) {
  if (typeof cls !== 'function') {
    console.error(`❌ ${name} should be a function, got ${typeof cls}`);
    process.exit(1);
  }
  console.log(`✓ ${name}: importable`);
}

// Verify static properties match destructured exports
if (Browser7.Browser7Error !== Browser7Error || Browser7.AuthenticationError !== AuthenticationError) {
  console.error('❌ Static properties should match destructured exports');
  process.exit(1);
}
console.log('✓ Static properties match destructured exports');

// Verify inheritance
const err = new AuthenticationError('test', 401);
if (!(err instanceof Browser7Error) || !(err instanceof Error)) {
  console.error('❌ AuthenticationError should extend Browser7Error and Error');
  process.exit(1);
}
console.log('✓ Inheritance chain correct');

try {
  const client = new Browser7({ apiKey: 'test_key' });
  console.log('✓ Client instantiation successful');
  console.log('✓ Client has render method:', typeof client.render);
  console.log('\n✅ CJS test passed!');
} catch (error) {
  console.error('❌ CJS test failed:', error.message);
  process.exit(1);
}
