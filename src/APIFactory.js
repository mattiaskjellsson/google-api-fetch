import AuthClient from './auth/AuthClient.js';
import DriveClient_v3 from './services/drive/DriveClient_v3.js';
import DocsClient_v1 from './services/docs/DocsClient_v1.js';
import SheetsClient_v4 from './services/sheets/SheetsClient_v4.js';

export default class ApiFactory {
  constructor(credentials) {
    if (!credentials) {
      throw new Error('ApiFactory requires credentials');
    }

    this.credentials = credentials;
    this._authClient = new AuthClient(credentials);
  }

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

  drive({ version, auth }) {
    let client;
    switch (version) {
      case 'v3':
        client = new DriveClient_v3(auth);
        break;
      default:
        throw new Error(`Drive version ${version} is not supported`);
    }

    return {
      files: {
        create: async (options) => {
          return await (await client.files()).create(options);
        },
        export: async (options, config) => {
          return await (await client.files()).export(options, config);
        },
        get: async (options) => {
          return await (await client.files()).get(options);
        },
      },
      permissions: {
        create: async (options) => {
          return await client.permissions().create(options);
        },
      }
    };
  }

  docs({ version, auth }) {
    let client;
    switch (version) {
      case 'v1':
        client = new DocsClient_v1(auth);
        break;
      default:
        throw new Error(`Docs version ${version} is not supported`);
    }
    
    return {
      documents: client.documents()
    };
  }
  
  sheets({ version, auth }) {
    let client;
    switch(version) {
      case 'v4':
        client = new SheetsClient_v4(auth);
        break;
      default:
        throw new Error(`Sheets version ${version} is not supported`);
    }
    
    return {
      spreadsheets: {
        get: async (options) => {
          return await client.sheets().spreadsheets.get(options);
        },
        batchUpdate: async (options) => {
          return await client.sheets().spreadsheets.batchUpdate(options);
        },
        values: {
          get: async (options) => {
            return await client.sheets().spreadsheets.values.get(options);
          },
          update: async (options) => {
            return await client.sheets().spreadsheets.values.update(options);
          },
          append: async (options) => {
            return await client.sheets().spreadsheets.values.append(options);
          }
        }
      }
    };
  }
}