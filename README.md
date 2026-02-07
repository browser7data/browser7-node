# Browser7 Node.js SDK

> ⚠️ **ALPHA RELEASE** - The Browser7 API is not yet publicly available. This SDK is published to reserve the package name. The API is expected to launch in **Q2 2026**.
>
> **Do not install this package yet** - it will not work until the Browser7 API is live. Follow [@browser7data](https://x.com/browser7data) or visit [browser7.com](https://browser7.com) for launch announcements.

---

Official Node.js client for the [Browser7](https://browser7.com) web scraping and rendering API.

Browser7 provides geo-targeted web scraping with automatic proxy management, CAPTCHA solving, and powerful wait actions for dynamic content.

## Features

- 🌍 **Geo-Targeting** - Render pages from specific countries and cities
- 🤖 **CAPTCHA Solving** - Automatic detection and solving of reCAPTCHA and Cloudflare Turnstile
- ⏱️ **Wait Actions** - Click elements, wait for selectors, text, or delays
- 🚀 **Performance** - Block images, track bandwidth, view timing metrics
- 🔄 **Automatic Polling** - Built-in polling with progress callbacks
- 📦 **Dual Package** - Works with both ESM (`import`) and CommonJS (`require`)
- 💪 **Zero Dependencies** - Uses Node.js native `fetch` and `zlib`

## Installation

```bash
npm install browser7
```

**Requirements:** Node.js 18+ (uses native `fetch` API)

## Quick Start

```javascript
// ESM
import Browser7 from 'browser7';

// Or CommonJS
const Browser7 = require('browser7');

// Create client
const client = new Browser7({ apiKey: 'your-api-key' });

// Simple render
const result = await client.render('https://example.com');
console.log(result.html);
```

## Authentication

Get your API key from the [Browser7 Dashboard](https://dashboard.browser7.com).

```javascript
const client = new Browser7({ apiKey: 'b7_your_api_key_here' });
```

## Usage Examples

### Basic Rendering

```javascript
const result = await client.render('https://example.com', {
  countryCode: 'US'
});

console.log(result.html);              // Rendered HTML
console.log(result.selectedCity);      // City used for rendering
```

### With Wait Actions

Use helper methods to create wait actions:

```javascript
const result = await client.render('https://example.com', {
  countryCode: 'GB',
  city: 'london',
  waitFor: [
    Browser7.waitForClick('.cookie-accept'),              // Click element
    Browser7.waitForSelector('.main-content', 'visible'), // Wait for element
    Browser7.waitForText('Subscribe', '.footer'),         // Wait for text
    Browser7.waitForDelay(2000)                           // Wait 2 seconds
  ]
});
```

### With CAPTCHA Solving

```javascript
const result = await client.render('https://protected-site.com', {
  countryCode: 'US',
  captcha: 'auto'  // Auto-detect and solve CAPTCHAs
});

console.log(result.captcha);  // CAPTCHA detection info
```

### With Progress Tracking

```javascript
const result = await client.render(
  'https://example.com',
  { countryCode: 'US' },
  (progress) => {
    console.log(`${progress.type}: ${progress.status}`);
    // Output: started: N/A
    // Output: polling: processing
    // Output: completed: completed
  }
);
```

### Performance Options

```javascript
const result = await client.render('https://example.com', {
  blockImages: true,     // Block images (default: true)
  captcha: 'disabled'    // Skip CAPTCHA detection (default: disabled)
});

console.log(result.bandwidthMetrics);  // Network stats
console.log(result.timingBreakdown);   // Performance metrics
```

### Fetch Additional URLs

```javascript
const result = await client.render('https://example.com', {
  fetchUrls: [
    'https://example.com/api/data',
    'https://example.com/api/user'
  ]
});

console.log(result.fetchResponses);  // Array of fetch responses
```

### Check Account Balance

```javascript
const balance = await client.getAccountBalance();

console.log(`Total: ${balance.totalBalanceFormatted}`);
console.log(`Renders remaining: ${balance.totalBalanceCents}`);
console.log(`\nBreakdown:`);
console.log(`  Paid: ${balance.breakdown.paid.formatted} (${balance.breakdown.paid.cents} renders)`);
console.log(`  Free: ${balance.breakdown.free.formatted} (${balance.breakdown.free.cents} renders)`);
console.log(`  Bonus: ${balance.breakdown.bonus.formatted} (${balance.breakdown.bonus.cents} renders)`);
```

## API Reference

### `new Browser7(options)`

Create a new Browser7 client.

**Parameters:**
- `options` (object): Configuration options
  - `apiKey` (string, required): Your Browser7 API key
  - `baseUrl` (string, optional): Full API base URL including version path (e.g., `'https://api.browser7.com/v1'`). Defaults to production API.

**Example:**
```javascript
// Production (default)
const client = new Browser7({ apiKey: 'your-api-key' });

// Canadian endpoint
const client = new Browser7({
  apiKey: 'your-api-key',
  baseUrl: 'https://ca-api.browser7.com/v1'
});
```

### `client.render(url, options, onProgress)`

Render a URL and poll for the result (recommended).

**Parameters:**
- `url` (string): The URL to render
- `options` (object, optional): Render options
- `onProgress` (function, optional): Progress callback

**Returns:** Promise<RenderResult>

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `countryCode` | string | Country code (e.g., 'US', 'GB', 'DE') | Auto-select |
| `city` | string | City name (e.g., 'new.york', 'london') | Auto-select |
| `waitFor` | WaitAction[] | Array of wait actions (max 10) | - |
| `captcha` | string | CAPTCHA mode: 'disabled', 'auto', 'recaptcha_v2', 'recaptcha_v3', 'turnstile' | 'disabled' |
| `blockImages` | boolean | Block images for faster rendering | true |
| `fetchUrls` | string[] | Additional URLs to fetch (max 10) | - |

**Wait Action Types:**

Use helper methods to create wait actions:

```javascript
// Wait for a delay
Browser7.waitForDelay(duration)

// Wait for an element
Browser7.waitForSelector(selector, state, timeout)
// state: 'visible' | 'hidden' | 'attached' (default: 'visible')

// Wait for text to appear
Browser7.waitForText(text, selector, timeout)
// selector is optional - limits search scope

// Click an element
Browser7.waitForClick(selector, timeout)
```

**Or create manually:**

```javascript
{
  waitFor: [
    { type: 'delay', duration: 3000 },
    { type: 'selector', selector: '.content', state: 'visible', timeout: 30000 },
    { type: 'text', text: 'Hello', selector: '.greeting', timeout: 30000 },
    { type: 'click', selector: '.button', timeout: 30000 }
  ]
}
```

**RenderResult:**

```javascript
{
  status: 'completed',
  html: '<!DOCTYPE html>...',               // Decompressed HTML
  loadStrategy: 'waitForPaintingStable',
  selectedCity: {
    name: 'new.york',
    displayName: 'New York',
    latitude: 40.7128,
    longitude: -74.0060,
    timezoneId: 'America/New_York'
  },
  bandwidthMetrics: {
    networkBytes: 524288,
    cachedBytes: 102400,
    cacheHitRate: '16.3%'
  },
  captcha: {
    detected: false,
    handled: false
  },
  timingBreakdown: {
    totalMs: 5234,
    navigationMs: 1523,
    loadStrategyMs: 2341,
    captchaMs: 45,
    waitActionsMs: 1325
  },
  fetchResponses: [],  // Array if fetchUrls was provided
  retryAfter: 1
}
```

### `client.createRender(url, options)`

Create a render job (low-level API).

**Returns:** Promise<{ renderId: string }>

### `client.getRender(renderId)`

Get the status and result of a render job (low-level API).

**Returns:** Promise<RenderResult>

### `client.getAccountBalance()`

Get the current account balance.

**Returns:** Promise<AccountBalance>

**AccountBalance:**

```javascript
{
  totalBalanceCents: 1300,           // Total balance in cents (also equals renders remaining)
  totalBalanceFormatted: "$13.00",   // Formatted as USD currency
  breakdown: {
    paid: {
      cents: 1050,                   // Paid balance in cents
      formatted: "$10.50"            // Formatted as USD
    },
    free: {
      cents: 200,                    // Free balance in cents
      formatted: "$2.00"             // Formatted as USD
    },
    bonus: {
      cents: 50,                     // Bonus balance in cents
      formatted: "$0.50"             // Formatted as USD
    }
  }
}
```

**Example:**

```javascript
const balance = await client.getAccountBalance();
console.log(`Total: ${balance.totalBalanceFormatted}`);
console.log(`Renders remaining: ${balance.totalBalanceCents}`);
```

**Note:** Since 1 cent = 1 render, `totalBalanceCents` directly shows how many renders you can perform.

## Helper Methods

### `Browser7.waitForDelay(duration)`

Create a delay wait action.

- `duration` (number): Duration in milliseconds (100-60000)

```javascript
Browser7.waitForDelay(3000)
// Returns: { type: 'delay', duration: 3000 }
```

### `Browser7.waitForSelector(selector, state, timeout)`

Create a selector wait action.

- `selector` (string): CSS selector
- `state` (string, optional): 'visible', 'hidden', or 'attached' (default: 'visible')
- `timeout` (number, optional): Timeout in milliseconds (default: 30000)

```javascript
Browser7.waitForSelector('.main-content', 'visible', 10000)
// Returns: { type: 'selector', selector: '.main-content', state: 'visible', timeout: 10000 }
```

### `Browser7.waitForText(text, selector, timeout)`

Create a text wait action.

- `text` (string): Text to wait for
- `selector` (string, optional): CSS selector to limit search scope
- `timeout` (number, optional): Timeout in milliseconds (default: 30000)

```javascript
Browser7.waitForText('In Stock', '.availability', 10000)
// Returns: { type: 'text', text: 'In Stock', selector: '.availability', timeout: 10000 }
```

### `Browser7.waitForClick(selector, timeout)`

Create a click wait action.

- `selector` (string): CSS selector of element to click
- `timeout` (number, optional): Timeout in milliseconds (default: 30000)

```javascript
Browser7.waitForClick('.cookie-accept', 5000)
// Returns: { type: 'click', selector: '.cookie-accept', timeout: 5000 }
```

## Error Handling

```javascript
try {
  const result = await client.render('https://example.com');
  console.log(result.html);
} catch (error) {
  if (error.message.includes('Failed to start render')) {
    console.error('API error:', error.message);
  } else if (error.message.includes('Render failed')) {
    console.error('Render failed:', error.message);
  } else if (error.message.includes('timed out')) {
    console.error('Render timed out');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Advanced Usage

### Two-Step Rendering (Manual Polling)

```javascript
// Step 1: Create render job
const { renderId } = await client.createRender('https://example.com', {
  countryCode: 'US'
});

// Step 2: Poll manually when ready
let result;
while (true) {
  result = await client.getRender(renderId);

  if (result.status === 'completed') {
    break;
  } else if (result.status === 'failed') {
    throw new Error(`Render failed: ${result.error}`);
  }

  // Wait before next poll (use server-suggested interval)
  await new Promise(resolve =>
    setTimeout(resolve, (result.retryAfter || 1) * 1000)
  );
}

console.log(result.html);
```

### Custom API Endpoint

```javascript
// Use regional endpoint
const client = new Browser7({
  apiKey: 'your-api-key',
  baseUrl: 'https://ca-api.browser7.com/v1'
});

// For local development/testing
const devClient = new Browser7({
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:3002/v1'
});
```

## Supported Countries

AT, BE, CA, CH, CZ, DE, FR, GB, HR, HU, IT, NL, PL, SK, US

See [Browser7 Documentation](https://docs.browser7.com) for available cities per country.

## CAPTCHA Support

Browser7 supports automatic CAPTCHA detection and solving for:

- **reCAPTCHA v2** - Google's image-based CAPTCHA
- **reCAPTCHA v3** - Google's score-based CAPTCHA
- **Cloudflare Turnstile** - Cloudflare's CAPTCHA alternative

**Modes:**
- `'disabled'` (default) - Skip CAPTCHA detection (fastest, ~60-250ms saved)
- `'auto'` - Auto-detect and solve any CAPTCHA type
- `'recaptcha_v2'`, `'recaptcha_v3'`, `'turnstile'` - Solve specific type (faster than auto)

**Recommended Workflow:**
1. First render: Use default (`captcha: 'disabled'`)
2. If HTML contains CAPTCHA: Re-render with `captcha: 'auto'`
3. For known CAPTCHA sites: Always specify `captcha` mode

## TypeScript Support

The SDK includes JSDoc comments for TypeScript IntelliSense:

```typescript
import Browser7 from 'browser7';

const client = new Browser7({ apiKey: 'your-api-key' });

// TypeScript will infer types from JSDoc
const result = await client.render('https://example.com', {
  countryCode: 'US',  // TypeScript knows this is a string
  blockImages: true   // TypeScript knows this is a boolean
});

console.log(result.html);  // TypeScript knows html is a string
```

## Contributing

Issues and pull requests are welcome! Please visit our [GitHub repository](https://github.com/browser7data/browser7-node).

## License

MIT

## Support

- 📧 Email: support@browser7.com
- 📚 Documentation: https://docs.browser7.com
- 🐛 Issues: https://github.com/browser7data/browser7-node/issues
- 💬 Discord: https://discord.gg/browser7

## Links

- [Browser7 Website](https://browser7.com)
- [API Documentation](https://docs.browser7.com/api)
- [Dashboard](https://dashboard.browser7.com)
- [Pricing](https://browser7.com/pricing)
