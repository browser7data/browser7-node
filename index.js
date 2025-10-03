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
 * @property {boolean} [fetchUrl] - Whether to fetch the URL
 * @property {function(ProgressEvent): void} [onProgress] - Optional progress callback
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
   * Render a URL and poll for the result
   * @param {string} url - The URL to render
   * @param {RenderOptions} [options={}] - Optional render parameters
   * @param {number} [pollInterval=1000] - Polling interval in milliseconds
   * @param {number} [maxAttempts=60] - Maximum number of polling attempts
   * @returns {Promise<RenderResult>} The render result
   */
  async render(url, options = {}, pollInterval = 1000, maxAttempts = 60) {
    // Extract onProgress callback from options
    const { onProgress, ...apiOptions } = options;

    // Build request payload with only defined API options
    const payload = { url };
    if (apiOptions.countryCode !== undefined) payload.countryCode = apiOptions.countryCode;
    if (apiOptions.city !== undefined) payload.city = apiOptions.city;
    if (apiOptions.delay !== undefined) payload.delay = apiOptions.delay;
    if (apiOptions.fetchUrl !== undefined) payload.fetchUrl = apiOptions.fetchUrl;

    // Start the render
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

    const { renderId } = await renderResponse.json();

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
