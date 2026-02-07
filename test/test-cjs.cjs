// Test CommonJS require
const Browser7 = require('../dist/index.cjs');

console.log('✓ CJS require successful');
console.log('✓ Browser7 class:', typeof Browser7);
console.log('✓ waitForDelay:', typeof Browser7.waitForDelay);

try {
  const client = new Browser7({ apiKey: 'test_key' });
  console.log('✓ Client instantiation successful');
  console.log('✓ Client has render method:', typeof client.render);
  console.log('\n✅ CJS test passed!');
} catch (error) {
  console.error('❌ CJS test failed:', error.message);
  process.exit(1);
}
