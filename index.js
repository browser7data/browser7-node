const zlib = require('zlib');
const { promisify } = require('util');
const gunzip = promisify(zlib.gunzip);

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
 * @typedef {Object} RenderOptions
 * @property {string} [countryCode] - Country code for the render
 * @property {string} [city] - City for the render
 * @property {number} [delay] - Delay in milliseconds before capturing
 * @property {string[]} [fetchUrls] - List of URLs to fetch
 */

/**
 * @typedef {Object} RenderResponse
 * @property {string} renderId - The ID of the render job
 */

/**
 * @typedef {Object} RenderResult
 * @property {string} status - The status of the render (e.g., "completed", "processing", "failed")
 * @property {*} [data] - The render result data (structure depends on API response)
 */

class Browser7 {
  /**
   * Create a Browser7 API client
   * @param {string} apiKey - Your Browser7 API key
   */
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = process.env.BROWSER7_API_URL || 'https://api.browser7.com/v1';
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
    if (options.delay !== undefined) payload.delay = options.delay;
    if (options.fetchUrls !== undefined) payload.fetchUrls = options.fetchUrls;

    const renderUrl = `${this.baseUrl}/renders`;

    let renderResponse;
    try {
      renderResponse = await fetch(renderUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
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
          'Authorization': `Bearer ${this.apiKey}`
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
}

module.exports = Browser7;
