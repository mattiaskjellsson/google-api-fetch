import AuthClient from './auth/AuthClient.js';
import DriveClient_v3 from './services/drive/DriveClient_v3.js';
import DocsClient_v1 from './services/docs/DocsClient_v1.js';
import SheetsClient_v4 from './services/sheets/SheetsClient_v4.js';

export default class GoogleApiFactory {
  /**
   * Create a new GoogleApi client
   * @param {Object} credentials - Service account credentials
   * @param {string} credentials.client_email - Client email from credentials
   * @param {string} credentials.private_key - Private key from credentials
   */
  constructor(credentials) {
    if (!credentials) {
      throw new Error('Credentials required');
    }

    this.credentials = credentials;
    this._authClient = new AuthClient(credentials);
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

    return client.getInterface();
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
}

export { 
  AuthClient,
  DriveClient_v3,
  DocsClient_v1,
  SheetsClient_v4
};