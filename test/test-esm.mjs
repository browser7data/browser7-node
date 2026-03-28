// Test ESM import
import Browser7, {
  Browser7Error,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  InsufficientBalanceError,
  RenderError
} from '../dist/index.mjs';

console.log('✓ ESM import successful');
console.log('✓ Browser7 class:', typeof Browser7);
console.log('✓ waitForDelay:', typeof Browser7.waitForDelay);

// Verify error classes are importable
const errorClasses = { Browser7Error, AuthenticationError, ValidationError, RateLimitError, InsufficientBalanceError, RenderError };
for (const [name, cls] of Object.entries(errorClasses)) {
  if (typeof cls !== 'function') {
    console.error(`❌ ${name} should be a function, got ${typeof cls}`);
    process.exit(1);
  }
  console.log(`✓ ${name}: importable`);
}

// Verify inheritance
const err = new Browser7Error('test');
if (!(err instanceof Error)) {
  console.error('❌ Browser7Error should be instanceof Error');
  process.exit(1);
}
console.log('✓ Browser7Error extends Error');

const authErr = new AuthenticationError('test', 401);
if (!(authErr instanceof Browser7Error) || !(authErr instanceof Error)) {
  console.error('❌ AuthenticationError should extend Browser7Error and Error');
  process.exit(1);
}
console.log('✓ AuthenticationError extends Browser7Error');

// Verify static properties match named exports
if (Browser7.Browser7Error !== Browser7Error || Browser7.AuthenticationError !== AuthenticationError) {
  console.error('❌ Static properties should match named exports');
  process.exit(1);
}
console.log('✓ Static properties match named exports');

try {
  const client = new Browser7({ apiKey: 'test_key' });
  console.log('✓ Client instantiation successful');
  console.log('✓ Client has render method:', typeof client.render);
  console.log('\n✅ ESM test passed!');
} catch (error) {
  console.error('❌ ESM test failed:', error.message);
  process.exit(1);
}
