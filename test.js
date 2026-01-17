require('dotenv').config();
const Browser7 = require('./index');

async function test() {
  const domain = process.argv[2];

  if (!domain) {
    console.error('Usage: node test.js <domain> [example-type]');
    console.error('');
    console.error('Examples:');
    console.error('  node test.js www.cnn.com basic          - Basic render');
    console.error('  node test.js www.bbc.com waitfor        - With waitFor actions');
    console.error('  node test.js protected-site.com captcha - With CAPTCHA solving');
    console.error('  node test.js example.com full           - Full featured render');
    process.exit(1);
  }

  const url = `https://${domain}`;
  const exampleType = process.argv[3] || 'basic';

  // Use API key from environment variable or hardcoded test key
  const apiKey = process.env.BROWSER7_API_KEY || 'b7_3UDv9IokpWizKT4FrtfWEy';

  // Optional: Override base URL for testing (defaults to production)
  const baseUrl = process.env.BROWSER7_API_URL;  // e.g., 'https://api.browser7.dev/v1'
  const browser7 = new Browser7({
    apiKey,
    ...(baseUrl && { baseUrl })
  });

  console.log('Browser7 Node.js SDK Test');
  console.log('='.repeat(50));
  console.log('Base URL:', browser7.baseUrl);
  console.log(`Rendering: ${url}`);
  console.log(`Example Type: ${exampleType}`);
  console.log('='.repeat(50));

  try {
    let options = {};

    // Configure options based on example type
    switch (exampleType) {
      case 'waitfor':
        console.log('\nUsing waitFor actions with helper methods:');
        options = {
          countryCode: 'US',
          waitFor: [
            Browser7.waitForClick('.cookie-accept'),  // Click cookie banner
            Browser7.waitForSelector('.main-content', 'visible'),  // Wait for content
            Browser7.waitForDelay(2000)  // Wait 2 seconds
          ]
        };
        break;

      case 'captcha':
        console.log('\nWith CAPTCHA solving enabled:');
        options = {
          countryCode: 'US',
          captcha: 'auto',  // Auto-detect and solve CAPTCHAs
          waitFor: [
            Browser7.waitForSelector('.content-loaded', 'visible')
          ]
        };
        break;

      case 'full':
        console.log('\nFull-featured render:');
        options = {
          countryCode: 'GB',
          city: 'london',
          blockImages: false,  // Load images
          captcha: 'disabled',  // Skip CAPTCHA detection (default)
          waitFor: [
            Browser7.waitForClick('.cookie-consent-accept'),
            Browser7.waitForSelector('.article-body', 'visible'),
            Browser7.waitForText('Subscribe', '.footer'),
            Browser7.waitForDelay(1000)
          ],
          fetchUrls: [
            // Additional URLs to fetch (if applicable)
          ]
        };
        break;

      default:  // 'basic'
        console.log('\nBasic render:');
        options = {
          countryCode: 'US'
        };
        break;
    }

    console.log('\nOptions:', JSON.stringify(options, null, 2));
    console.log('\nStarting render...\n');

    const result = await browser7.render(
      url,
      options,
      (event) => {
        const timestamp = new Date(event.timestamp).toISOString();
        const status = event.status || 'N/A';
        const attempt = event.attempt ? ` (attempt ${event.attempt})` : '';
        console.log(`[${timestamp}] [${event.renderId}] ${event.type} - status: ${status}${attempt}`);
      }
    );

    console.log('\n' + '='.repeat(50));
    console.log('Render completed successfully!');
    console.log('='.repeat(50));
    console.log('\nResult Summary:');
    console.log('  Status:', result.status);
    console.log('  Load Strategy:', result.loadStrategy);
    console.log('  City Used:', result.selectedCity?.displayName);
    console.log('  HTML Length:', result.html?.length || 0, 'characters');
    console.log('  Screenshot Size:', result.screenshot?.length || 0, 'bytes');

    if (result.bandwidthMetrics) {
      console.log('\nBandwidth:');
      console.log('  Network:', (result.bandwidthMetrics.networkBytes / 1024).toFixed(2), 'KB');
      console.log('  Cached:', (result.bandwidthMetrics.cachedBytes / 1024).toFixed(2), 'KB');
      console.log('  Cache Hit Rate:', result.bandwidthMetrics.cacheHitRate);
    }

    if (result.captcha) {
      console.log('\nCAPTCHA:');
      console.log('  Detected:', result.captcha.detected);
      console.log('  Handled:', result.captcha.handled);
      if (result.captcha.sitekey) {
        console.log('  Sitekey:', result.captcha.sitekey);
      }
    }

    if (result.timingBreakdown) {
      console.log('\nTiming Breakdown:');
      console.log('  Total:', result.timingBreakdown.totalMs, 'ms');
      console.log('  Navigation:', result.timingBreakdown.navigationMs, 'ms');
      console.log('  Load Strategy:', result.timingBreakdown.loadStrategyMs, 'ms');
      console.log('  CAPTCHA:', result.timingBreakdown.captchaMs, 'ms');
      console.log('  Wait Actions:', result.timingBreakdown.waitActionsMs, 'ms');
    }

    if (result.fetchResponses && result.fetchResponses.length > 0) {
      console.log('\nFetch Responses:', result.fetchResponses.length, 'fetched');
    }

    console.log('\n' + '='.repeat(50));
    console.log('\nFull result object:');
    console.dir(result, { depth: null, colors: true });

  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('Error occurred:');
    console.error('='.repeat(50));
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
