import zlib from 'zlib';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const gunzip = promisify(zlib.gunzip);

// Get package version for User-Agent header
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const USER_AGENT = `browser7-node/${packageJson.version}`;

/**
 * @typedef {Object} ProgressEvent
 * @property {string} type - Event type ('started', 'polling', 'completed', 'failed')
 * @property {string} renderId - The render ID
 * @property {string} timestamp - ISO timestamp
 * @property {string} [status] - Current render status
 * @property {number} [attempt] - Current polling attempt number
 * @property {number} [retryAfter] - Server-suggested retry interval in seconds
 */

/**
 * @typedef {Object} WaitAction
 * @property {string} type - Action type ('delay', 'selector', 'text', 'click')
 * @property {number} [duration] - Duration in milliseconds (for 'delay' type)
 * @property {string} [selector] - CSS selector (for 'selector', 'text', 'click' types)
 * @property {string} [state] - Element state: 'visible', 'hidden', 'attached' (for 'selector' type)
 * @property {string} [text] - Text to wait for (for 'text' type)
 * @property {number} [timeout] - Timeout in milliseconds (for 'selector', 'text', 'click' types)
 */

/**
 * @typedef {Object} RenderOptions
 * @property {string} [countryCode] - Country code for the render (e.g., 'US', 'GB', 'DE')
 * @property {string} [city] - City name for the render (e.g., 'new.york', 'london')
 * @property {string[]} [fetchUrls] - List of URLs to fetch after rendering
 * @property {WaitAction[]} [waitFor] - Array of wait actions to execute (max 10)
 * @property {string} [captcha] - CAPTCHA mode: 'disabled', 'auto', 'recaptcha_v2', 'recaptcha_v3', 'turnstile' (default: 'disabled')
 * @property {boolean} [blockImages] - Whether to block images (default: true)
 * @property {boolean} [includeScreenshot] - Enable screenshot capture in the response (default: false)
 * @property {string} [screenshotFormat] - Screenshot format: 'jpeg' or 'png' (default: 'jpeg')
 * @property {number} [screenshotQuality] - JPEG quality 1-100 (default: 80, only applies to JPEG format)
 * @property {boolean} [screenshotFullPage] - Capture full scrollable page or viewport only (default: false)
 */

/**
 * @typedef {Object} RenderResponse
 * @property {string} renderId - The ID of the render job
 */

/**
 * @typedef {Object} SelectedCity
 * @property {string} name - City name
 * @property {string} displayName - Display name for the city
 * @property {number} latitude - City latitude
 * @property {number} longitude - City longitude
 * @property {string} timezoneId - Timezone identifier
 */

/**
 * @typedef {Object} BandwidthMetrics
 * @property {number} networkBytes - Bytes downloaded from network
 * @property {number} cachedBytes - Bytes served from cache
 * @property {string} cacheHitRate - Cache hit rate percentage
 */

/**
 * @typedef {Object} CaptchaInfo
 * @property {boolean} detected - Whether CAPTCHA was detected
 * @property {boolean} handled - Whether CAPTCHA was solved
 * @property {string} [sitekey] - CAPTCHA sitekey if detected
 */

/**
 * @typedef {Object} RenderResult
 * @property {string} status - The status of the render ("completed", "processing", "failed", etc.)
 * @property {string} [html] - The rendered HTML (automatically decompressed)
 * @property {Array} [fetchResponses] - Array of fetch response objects (automatically decompressed)
 * @property {string} [screenshot] - Base64-encoded screenshot image (if includeScreenshot was true)
 * @property {string} loadStrategy - Load strategy used for rendering
 * @property {SelectedCity} selectedCity - City used for the render
 * @property {BandwidthMetrics} bandwidthMetrics - Network bandwidth statistics
 * @property {CaptchaInfo} captcha - CAPTCHA detection and handling info
 * @property {Object} timingBreakdown - Performance timing breakdown
 * @property {number} retryAfter - Server-suggested retry interval in seconds
 * @property {string} [error] - Error message if status is 'failed'
 */

class Browser7 {
  /**
   * Create a Browser7 API client
   * @param {Object} options - Configuration options
   * @param {string} options.apiKey - Your Browser7 API key
   * @param {string} [options.baseUrl] - Full API base URL including version path
   *                                      (e.g., 'https://api.browser7.com/v1')
   *                                      Defaults to production API
   */
  constructor(options = {}) {
    if (!options.apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://api.browser7.com/v1';
  }

  /**
   * Create a new render job
   * @param {string} url - The URL to render
   * @param {RenderOptions} [options={}] - Optional render parameters
   * @returns {Promise<RenderResponse>} Object containing renderId
   */
  async createRender(url, options = {}) {
    // Build request payload with only defined API options
    const payload = { url };
    if (options.countryCode !== undefined) payload.countryCode = options.countryCode;
    if (options.city !== undefined) payload.city = options.city;
    if (options.fetchUrls !== undefined) payload.fetchUrls = options.fetchUrls;
    if (options.waitFor !== undefined) payload.waitFor = options.waitFor;
    if (options.captcha !== undefined) payload.captcha = options.captcha;
    if (options.blockImages !== undefined) payload.blockImages = options.blockImages;
    if (options.includeScreenshot !== undefined) payload.includeScreenshot = options.includeScreenshot;
    if (options.screenshotFormat !== undefined) payload.screenshotFormat = options.screenshotFormat;
    if (options.screenshotQuality !== undefined) payload.screenshotQuality = options.screenshotQuality;
    if (options.screenshotFullPage !== undefined) payload.screenshotFullPage = options.screenshotFullPage;

    const renderUrl = `${this.baseUrl}/renders`;

    let renderResponse;
    try {
      renderResponse = await fetch(renderUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      throw new Error(`Failed to connect to ${renderUrl}: ${error.message}`);
    }

    if (!renderResponse.ok) {
      const error = await renderResponse.text();
      throw new Error(`Failed to start render: ${renderResponse.status} ${error}`);
    }

    return await renderResponse.json();
  }

  /**
   * Get the status and result of a render job
   * @param {string} renderId - The render ID to retrieve
   * @returns {Promise<RenderResult>} The render result with current status
   */
  async getRender(renderId) {
    const statusUrl = `${this.baseUrl}/renders/${renderId}`;

    let resultResponse;
    try {
      resultResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': USER_AGENT
        }
      });
    } catch (error) {
      throw new Error(`Failed to connect to ${statusUrl}: ${error.message}`);
    }

    if (!resultResponse.ok) {
      const error = await resultResponse.text();
      throw new Error(`Failed to get render status: ${resultResponse.status} ${error}`);
    }

    const result = await resultResponse.json();

    // Decompress the gzipped HTML if present
    if (result.html) {
      try {
        const buffer = Buffer.from(result.html, 'base64');
        const decompressed = await gunzip(buffer);
        result.html = decompressed.toString('utf-8');
      } catch (error) {
        // Silently fail decompression
      }
    }

    // Decompress and parse fetchResponses if present
    if (result.fetchResponses) {
      try {
        const buffer = Buffer.from(result.fetchResponses, 'base64');
        const decompressed = await gunzip(buffer);
        const jsonString = decompressed.toString('utf-8');
        result.fetchResponses = JSON.parse(jsonString);
      } catch (error) {
        // Silently fail decompression/parsing
      }
    }

    return result;
  }

  /**
   * @typedef {Object} BalanceBreakdown
   * @property {number} cents - Balance in cents
   * @property {string} formatted - Formatted balance (e.g., "$10.50")
   */

  /**
   * @typedef {Object} AccountBalance
   * @property {number} totalBalanceCents - Total balance in cents (also equals total renders remaining)
   * @property {string} totalBalanceFormatted - Total balance formatted as USD currency
   * @property {Object} breakdown - Breakdown by balance type
   * @property {BalanceBreakdown} breakdown.paid - Paid balance details
   * @property {BalanceBreakdown} breakdown.free - Free balance details
   * @property {BalanceBreakdown} breakdown.bonus - Bonus balance details
   */

  /**
   * Get the current account balance
   * @returns {Promise<AccountBalance>} The account balance
   */
  async getAccountBalance() {
    const balanceUrl = `${this.baseUrl}/account/balance`;

    let balanceResponse;
    try {
      balanceResponse = await fetch(balanceUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': USER_AGENT
        }
      });
    } catch (error) {
      throw new Error(`Failed to connect to ${balanceUrl}: ${error.message}`);
    }

    if (!balanceResponse.ok) {
      const error = await balanceResponse.text();
      throw new Error(`Failed to get account balance: ${balanceResponse.status} ${error}`);
    }

    return await balanceResponse.json();
  }

  /**
   * Render a URL and poll for the result
   * @param {string} url - The URL to render
   * @param {RenderOptions} [options={}] - Optional render parameters
   * @param {function(ProgressEvent): void} [onProgress] - Optional progress callback
   * @returns {Promise<RenderResult>} The render result
   */
  async render(url, options = {}, onProgress) {
    const maxAttempts = 60;

    const { renderId } = await this.createRender(url, options);

    // Emit started event
    if (onProgress) {
      onProgress({
        type: 'started',
        renderId,
        timestamp: new Date().toISOString()
      });
    }

    // Wait 2 seconds before starting to poll
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Poll for the result
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getRender(renderId);

      // Emit polling event
      if (onProgress) {
        onProgress({
          type: 'polling',
          renderId,
          timestamp: new Date().toISOString(),
          status: result.status,
          attempt: attempt + 1,
          retryAfter: result.retryAfter
        });
      }

      if (result.status === 'completed') {
        // Emit completed event
        if (onProgress) {
          onProgress({
            type: 'completed',
            renderId,
            timestamp: new Date().toISOString(),
            status: result.status
          });
        }

        return result;
      }

      if (result.status === 'failed') {
        // Emit failed event
        if (onProgress) {
          onProgress({
            type: 'failed',
            renderId,
            timestamp: new Date().toISOString(),
            status: result.status
          });
        }
        throw new Error(`Render failed: ${result.error || 'Unknown error'}`);
      }

      // Wait before polling again - use server-suggested interval or default to 1 second
      const retryAfter = result.retryAfter ? result.retryAfter * 1000 : 1000;
      await new Promise(resolve => setTimeout(resolve, retryAfter));
    }

    throw new Error(`Render timed out after ${maxAttempts} attempts`);
  }

  /**
   * Helper method to create a delay wait action
   * @param {number} duration - Duration in milliseconds (100-60000)
   * @returns {WaitAction} A delay wait action object
   * @static
   */
  static waitForDelay(duration) {
    return {
      type: 'delay',
      duration
    };
  }

  /**
   * Helper method to create a selector wait action
   * @param {string} selector - CSS selector to wait for
   * @param {string} [state='visible'] - Element state: 'visible', 'hidden', or 'attached'
   * @param {number} [timeout=30000] - Timeout in milliseconds (1000-60000)
   * @returns {WaitAction} A selector wait action object
   * @static
   */
  static waitForSelector(selector, state = 'visible', timeout = 30000) {
    return {
      type: 'selector',
      selector,
      state,
      timeout
    };
  }

  /**
   * Helper method to create a text wait action
   * @param {string} text - Text to wait for
   * @param {string} [selector] - Optional CSS selector to limit search scope
   * @param {number} [timeout=30000] - Timeout in milliseconds (1000-60000)
   * @returns {WaitAction} A text wait action object
   * @static
   */
  static waitForText(text, selector, timeout = 30000) {
    const action = {
      type: 'text',
      text,
      timeout
    };
    if (selector) {
      action.selector = selector;
    }
    return action;
  }

  /**
   * Helper method to create a click wait action
   * @param {string} selector - CSS selector of element to click
   * @param {number} [timeout=30000] - Timeout in milliseconds (1000-60000)
   * @returns {WaitAction} A click wait action object
   * @static
   */
  static waitForClick(selector, timeout = 30000) {
    return {
      type: 'click',
      selector,
      timeout
    };
  }
}

export default Browser7;
