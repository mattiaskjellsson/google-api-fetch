export default class SheetsClient_v4 {
  constructor(authClient) {
    this.authClient = authClient;
    this.baseUrl = 'https://sheets.googleapis.com/v4';
  }

  getInterface() {
    return {
      spreadsheets: this.sheets()
    };
  }

  sheets() {
    return {
      spreadsheets: {
        get: async ({ spreadsheetId }) => {
          const headers = await this.authClient.getAuthHeaders();
          
          const response = await fetch(`${this.baseUrl}/spreadsheets/${spreadsheetId}`, {
            headers
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to get spreadsheet: ${JSON.stringify(error)}`);
          }
          
          return { data: await response.json() };
        },
        
        batchUpdate: async ({ spreadsheetId, resource }) => {
          const headers = await this.authClient.getAuthHeaders();
          
          const response = await fetch(`${this.baseUrl}/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers,
            body: JSON.stringify(resource)
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to batch update: ${JSON.stringify(error)}`);
          }
          
          return { data: await response.json() };
        },
        
        values: {
          get: async ({ spreadsheetId, range }) => {
            const headers = await this.authClient.getAuthHeaders();
            
            const response = await fetch(
              `${this.baseUrl}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, 
              { headers }
            );
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(`Failed to get values: ${JSON.stringify(error)}`);
            }
            
            return { data: await response.json() };
          },
          
          update: async ({ spreadsheetId, range, valueInputOption, resource }) => {
            const headers = await this.authClient.getAuthHeaders();
            
            const response = await fetch(
              `${this.baseUrl}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}`, 
              {
                method: 'PUT',
                headers,
                body: JSON.stringify(resource)
              }
            );
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(`Failed to update values: ${JSON.stringify(error)}`);
            }
            
            return { data: await response.json() };
          },
          
          append: async ({ spreadsheetId, range, valueInputOption, resource }) => {
            const headers = await this.authClient.getAuthHeaders();
            
            const response = await fetch(
              `${this.baseUrl}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}`, 
              {
                method: 'POST',
                headers,
                body: JSON.stringify(resource)
              }
            );
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(`Failed to append values: ${JSON.stringify(error)}`);
            }
            
            return { data: await response.json() };
          }
        }
      }
    };
  }
}