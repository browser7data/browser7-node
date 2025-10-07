# browser7-node

Official Node.js/JavaScript SDK for the Browser7 web scraping and rendering API.

## Repository Purpose

This is the **primary reference implementation** for all Browser7 client SDKs. The browser7-node repository serves as:

1. **Public npm Package**: Published to npm registry for easy integration
2. **Reference Implementation**: Changes made here are propagated to other language SDKs (Python, PHP, Java, Go)
3. **Client Library**: Provides a simple, intuitive interface for the Browser7 API

Users can start rendering web pages through the Browser7 API in just a couple lines of code after installing from npm.

## Technology Stack

### Runtime & Language
- **Node.js**: v18+ (uses native `fetch` API, no external HTTP libraries)
- **JavaScript**: ES6+ (CommonJS module format)

### Dependencies
- **dotenv**: ^16.0.0 (dev dependency for environment configuration)

### Core Features
- Native Node.js `fetch` API (requires Node.js 18+)
- Built-in `zlib` for gzip decompression
- Promise-based async/await API
- Zero production dependencies

## Key Features Implemented

### 1. Direct API Methods
- `createRender(url, options)` - POST to `/v1/renders` endpoint
- `getRender(renderId)` - GET from `/v1/renders/:id` endpoint

### 2. Convenience Methods
- `render(url, options, onProgress)` - All-in-one method that creates render job and polls for completion

### 3. Advanced Capabilities
- **Automatic Gzip Decompression**: HTML and fetchResponses are automatically decompressed from base64-encoded gzipped data
- **Progress Callbacks**: Real-time event streaming during render polling
- **Smart Retry Logic**: Respects server-suggested `retryAfter` intervals
- **Configurable Options**: Support for country/city targeting, delays, and fetch URLs

### 4. Render Options
```javascript
{
  countryCode: string,  // Target country for render
  city: string,         // Target city for render
  delay: number,        // Delay in ms before capturing
  fetchUrls: string[]   // Additional URLs to fetch during render
}
```

### 5. Progress Events
The `render()` method supports progress callbacks with these event types:
- `started` - Render job created
- `polling` - Polling for status (includes attempt number and retryAfter)
- `completed` - Render successful
- `failed` - Render failed

## Architecture & Code Organization

### File Structure
```
browser7-node/
├── index.js           # Main SDK implementation (Browser7 class)
├── test.js            # Test/example script
├── package.json       # Package metadata and dependencies
├── package-lock.json  # Locked dependency versions
├── LICENSE            # MIT License
├── .env               # Local environment config (gitignored)
├── .gitignore         # Standard Node.js gitignore
└── node_modules/      # Dependencies (gitignored)
```

### Main Class: Browser7

**Location**: `index.js:34-211`

#### Constructor
```javascript
constructor(apiKey)
```
- Validates API key
- Sets base URL from `BROWSER7_API_URL` env var or defaults to `https://api.browser7.com/v1`

#### Public Methods

**createRender(url, options)**
- Creates a new render job
- Returns: `{ renderId: string }`
- Handles connection errors and HTTP errors

**getRender(renderId)**
- Retrieves render status and results
- Automatically decompresses HTML (base64 gzipped → UTF-8 string)
- Automatically decompresses and parses fetchResponses (base64 gzipped → JSON)
- Returns: `{ status, data, html, fetchResponses, ... }`

**render(url, options, onProgress)**
- High-level convenience method
- Creates render, polls for completion (max 60 attempts)
- Initial 2-second wait before first poll
- Uses server-suggested retry intervals or defaults to 1 second
- Emits progress events via callback
- Returns completed render result or throws error

### Data Decompression Pattern

The SDK automatically handles Browser7's data compression:

1. **HTML field**: base64 → gunzip → UTF-8 string
2. **fetchResponses field**: base64 → gunzip → JSON parse

Decompression failures are silently caught to handle cases where data isn't compressed.

### Error Handling

- **Connection errors**: Wrapped with context about which endpoint failed
- **HTTP errors**: Include status code and response body
- **Render failures**: Detected from status field, includes error message
- **Timeouts**: After 60 polling attempts (configurable in code)

## Dependencies on Other Browser7 Repos

### Direct Dependencies
- **browser7-api**: Core API service this SDK communicates with
  - Endpoints: `POST /v1/renders`, `GET /v1/renders/:id`
  - Authentication: Bearer token in Authorization header

### No Direct Dependencies On
- browser7-models (API handles database)
- browser7-infrastructure (deployment only)
- browser7-dashboard (separate user interface)
- browser7-sync (internal service)

## Development Setup

### Prerequisites
- Node.js 18+ (required for native `fetch` API)
- npm (comes with Node.js)

### Installation
```bash
# Clone the repository
cd browser7-node

# Install dependencies
npm install

# Configure environment (for local development)
cp .env.example .env  # If exists, or create .env manually
```

### Environment Variables

**`.env` file** (local development):
```bash
BROWSER7_API_URL=https://api.browser7.local/v1  # Local dev
NODE_TLS_REJECT_UNAUTHORIZED=0                   # Disable SSL verification for local
```

**Production**: No .env needed, SDK defaults to `https://api.browser7.com/v1`

### Testing

**Run test script**:
```bash
node test.js <domain>

# Example
node test.js www.cnn.com
```

The test script (`test.js:1-36`):
- Accepts domain as CLI argument
- Uses hardcoded test API key (update for your environment)
- Shows progress events during render
- Outputs full result object with `console.dir`

### API Key

Test script currently uses: `b7_3UDv9IokpWizKT4FrtfWEy`

For production use, obtain API key from:
- browser7-dashboard (user portal)
- Environment variables in your application

## Important Conventions and Patterns

### Code Style
- **JSDoc comments**: All public methods and types are documented
- **Error messages**: Include context (URL, status code, error body)
- **Promise-based**: All async operations use async/await
- **CommonJS**: Uses `require()` and `module.exports` for Node.js compatibility

### API Communication
- **Authentication**: Bearer token in `Authorization` header
- **Content-Type**: `application/json` for POST requests
- **Base URL**: Configurable via environment variable
- **Polling Strategy**: Initial 2-second delay, then 1-second intervals (or server-suggested)

### TypeScript Support
While the SDK is written in JavaScript, JSDoc comments provide:
- Type hints for IDEs
- IntelliSense support
- Type definitions for TypeScript consumers

### Versioning
- Current version: 1.0.0
- Package name: `browser7`
- License: MIT

## Deployment Information

### Publishing to npm

**Pre-publish checklist**:
1. Remove or update test API key in `test.js`
2. Ensure `.env` is in `.gitignore` (already is)
3. Update version in `package.json`
4. Ensure `package.json` metadata is complete:
   - Author name
   - Repository URL
   - Homepage URL
   - Bug report URL

**Publish command**:
```bash
npm publish
```

**Installation by users**:
```bash
npm install browser7
```

### Version Management
Follow semantic versioning (semver):
- **Major**: Breaking API changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Environment-Specific Configuration

**Development**:
```javascript
BROWSER7_API_URL=https://api.browser7.local/v1
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Staging**:
```javascript
BROWSER7_API_URL=https://api.browser7.dev/v1
```

**Production** (default):
```javascript
// No configuration needed, uses default
// https://api.browser7.com/v1
```

## Usage Examples

### Basic Usage
```javascript
const Browser7 = require('browser7');

const client = new Browser7('your-api-key');
const result = await client.render('https://example.com');
console.log(result.html);
```

### With Options
```javascript
const result = await client.render('https://example.com', {
  countryCode: 'US',
  city: 'New York',
  delay: 3000,
  fetchUrls: ['https://example.com/api/data']
});
```

### With Progress Tracking
```javascript
const result = await client.render(
  'https://example.com',
  {},
  (event) => {
    console.log(`${event.type}: ${event.status || 'N/A'}`);
  }
);
```

### Manual Control (Two-Step)
```javascript
// Step 1: Create render
const { renderId } = await client.createRender('https://example.com');

// Step 2: Poll when ready
const result = await client.getRender(renderId);
```

## Cross-Language SDK Propagation

When making changes to this repository:

1. **Implement and test** changes in browser7-node first
2. **Propagate logic** to other language SDKs:
   - browser7-python
   - browser7-php
   - browser7-java
   - browser7-go

3. **Maintain consistency** across:
   - Method names (adjust for language conventions)
   - Parameter handling
   - Error handling patterns
   - Decompression logic
   - Progress event structure

## Future Enhancements

Consider these improvements before public launch:

1. **Documentation**:
   - Add comprehensive README.md
   - API documentation website
   - Code examples repository

2. **Features**:
   - TypeScript definitions file (.d.ts)
   - Configurable timeout/max attempts
   - Retry logic for failed requests
   - Webhook support for async callbacks

3. **Testing**:
   - Unit tests (Jest/Mocha)
   - Integration tests
   - CI/CD pipeline

4. **Package Metadata**:
   - Complete author information
   - Repository URL in package.json
   - Keywords optimization for npm search

## Support and Resources

- **API Documentation**: [browser7-api repository]
- **Dashboard**: https://dashboard.browser7.com
- **Issues**: [Repository issues]
- **Production API**: https://api.browser7.com/v1

## Notes

- This is the **reference implementation** - all changes flow from here to other SDKs
- Requires Node.js 18+ due to native `fetch` API usage
- Zero production dependencies keeps the package lightweight
- MIT licensed for maximum compatibility with customer projects
