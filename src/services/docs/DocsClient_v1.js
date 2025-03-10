export default class DocsClient_v1 {
  constructor(authClient) {
    this.authClient = authClient;
    this.baseUrl = 'https://docs.googleapis.com/v1';
  }
  
  getInterface() {
    return {
      documents: this.documents()
    };
  }

  documents() {
    return {
      get: async (options) => {
        const headers = await this.authClient.getAuthHeaders();
        const { documentId } = options;
        
        const response = await fetch(`${this.baseUrl}/documents/${documentId}`, { headers });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to get document: ${JSON.stringify(error)}`);
        }

        return { data: await response.json() };
      },
      
      create: async (options) => {
        const headers = await this.authClient.getAuthHeaders();
        const { requestBody } = options;
        
        const response = await fetch(`${this.baseUrl}/documents`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to create document: ${JSON.stringify(error)}`);
        }

        return { data: await response.json() };
      },
      
      batchUpdate: async (options) => {
        const headers = await this.authClient.getAuthHeaders();
        const { documentId, requestBody } = options;
        
        const response = await fetch(`${this.baseUrl}/documents/${documentId}:batchUpdate`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to batch update document: ${JSON.stringify(error)}`);
        }

        return { data: await response.json() };
      }
    };
  }
}