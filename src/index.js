import AuthClient from './auth/AuthClient.js';
import DriveClient_v3 from './services/drive/DriveClient_v3.js';
import DocsClient_v1 from './services/docs/DocsClient_v1.js';
import SheetsClient_v4 from './services/sheets/SheetsClient_v4.js';
import RateLimiter from './utils/RateLimiter.js';
export default class GoogleApiFactory {
  /**
   * Create a new GoogleApi client
   * @param {Object} credentials - Service account credentials
   * @param {string} credentials.client_email - Client email from credentials
   * @param {string} credentials.private_key - Private key from credentials
   */
  constructor(credentials, options = {}) {
    if (!credentials) {
      throw new Error('Credentials required');
    }

    this.options = {
      enableRateLimiting: true,
      maxConcurrentRequests: 5,
      requestIntervalMs: 500,
      ...options
    };
    
    if (this.options.enableRateLimiting) {
      this.rateLimiter = new RateLimiter(
        this.options.maxConcurrentRequests,
        this.options.requestIntervalMs
      );
    }

    this.credentials = credentials;
    this._authClient = new AuthClient(credentials);
  }

  async _rateLimitedRequest(fn) {
    if (this.options.enableRateLimiting && this.rateLimiter) {
      return this.rateLimiter.execute(fn);
    }
    return fn();
  }

  _wrapWithRateLimiter(client) {
    if (!client || typeof client !== 'object') {
      return client;
    }

    const wrapped = {};

    for(const [key, value] of Object.entries(client)) {
      if (typeof value === 'function') {
        wrapped[key] = async (...args) => {
          return this._rateLimitedRequest(() => value(...args));
        };
      } else if (typeof value === 'object' && value !== null) {
        wrapped[key] = this._wrapWithRateLimiter(value);
      } else {
        wrapped[key] = value;
      }
    }

    return wrapped;
  }
  
  /**
   * Access Google Auth services
   * @returns {Object} Google Auth API
   */
  get auth() {
    return {
      GoogleAuth: class GoogleAuth {
        constructor(options) {
          this.credentials = options.credentials;
          this.scopes = options.scopes;
          this._client = new AuthClient(this.credentials);
        }

        async getClient() {
          return this._client;
        }

        getAccessToken() {
          return this._client.getAccessToken();
        }
      }
    };
  }

  /**
   * Access Google Drive services
   * @param {Object} options - Drive API options
   * @param {string} options.version - API version (default: 'v3')
   * @param {Object} options.auth - Auth client (optional)
   * @returns {Object} Drive API client
   */
  drive({ version = 'v3', auth } = {}) {
    let client;
    switch(version) {
      case 'v3':
        client = new DriveClient_v3(auth || this._authClient);
        break;
      default:
        throw new Error(`Unsupported Drive API version: ${version}`);
    }

    const iface = client.getInterface();

    if (!this.options.enableRateLimiting) {
      return iface;
    }

    return this._wrapWithRateLimiter(iface);
  }

  /**
   * Access Google Docs services
   * @param {Object} options - Docs API options
   * @param {string} options.version - API version (default: 'v1')
   * @param {Object} options.auth - Auth client (optional)
   * @returns {Object} Docs API client
   */
  docs({ version = 'v1', auth } = {}) {
    let client;
    switch(version) {
      case 'v1':
        client = new DocsClient_v1(auth || this._authClient);
        break;
      default:
        throw new Error(`Unsupported Docs API version: ${version}`);
    }
    
    return client.getInterface();
  }
  
  /**
   * Access Google Sheets services
   * @param {Object} options - Sheets API options
   * @param {string} options.version - API version (default: 'v4')
   * @param {Object} options.auth - Auth client (optional)
   * @returns {Object} Sheets API client
   */
  sheets({ version = 'v4', auth } = {}) {
    let client;
    switch(version) {
      case 'v4':
        client = new SheetsClient_v4(auth || this._authClient);
        break;
      default:
        throw new Error(`Unsupported Sheets API version: ${version}`);
    }

    return client.getInterface();
  }

  /**
   * Download a file using an existing access token
   * @param {string} fileId - The ID of the file to download
   * @param {string} accessToken - A valid Google API access token
   * @param {Object} options - Additional options
   * @returns {Promise<Buffer>} - The file content as a Buffer
   */
  static async downloadFile(fileId, accessToken, options = {}) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, 
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(options.headers || {})
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    return Buffer.from(await response.arrayBuffer());
  }

  async downloadFile(fileId, options = {}) {
    return this._rateLimitedRequest(async () => {
      const accessToken = await this._authClient.getAccessToken();
      return GoogleApiFactory.downloadFile(fileId, accessToken, options);
    });
  }
}

export { 
  AuthClient,
  DriveClient_v3,
  DocsClient_v1,
  SheetsClient_v4
};