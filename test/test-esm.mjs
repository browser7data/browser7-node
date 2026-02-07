// Test ESM import
import Browser7 from '../dist/index.mjs';

console.log('✓ ESM import successful');
console.log('✓ Browser7 class:', typeof Browser7);
console.log('✓ waitForDelay:', typeof Browser7.waitForDelay);

try {
  const client = new Browser7({ apiKey: 'test_key' });
  console.log('✓ Client instantiation successful');
  console.log('✓ Client has render method:', typeof client.render);
  console.log('\n✅ ESM test passed!');
} catch (error) {
  console.error('❌ ESM test failed:', error.message);
  process.exit(1);
}
