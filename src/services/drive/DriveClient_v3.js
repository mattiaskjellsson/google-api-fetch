export default class DriveClient_v3 {
  constructor(authClient) {
    this.authClient = authClient;
    this.baseUrl = 'https://www.googleapis.com/drive/v3';
    this.uploadUrl = 'https://www.googleapis.com/upload/drive/v3'; 
  }

  getInterface() {
    return {
      ...this.files(),
      files: this.files(),
      permissions: this.permissions(),
      auth: this.authClient
    };
  }

  files() {
    return {
      create: async (options) => {
        function concatUint8Arrays(arrays) {
          const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
          
          const result = new Uint8Array(totalLength);
          let offset = 0;
          
          for (const arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
          }
          
          return result;
        }

        const headers = await this.authClient.getAuthHeaders();
        const { requestBody, media } = options;
        
        if (media) {
          try {
            const createResponse = await fetch(`${this.baseUrl}/files`, {
              method: 'POST',
              headers: {
                ...headers,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
            });
  
            if (!createResponse.ok) {
              const error = await createResponse.json();
              throw new Error(`Failed to create file metadata: ${JSON.stringify(error)}`);
            }
            
            const fileData = await createResponse.json();
            const fileId = fileData.id;
            
            let mediaContent;
            if (media.body instanceof ReadableStream ) {
              const chunks = [];
              const readStream = media.body.getReader();
              
              while (true) {
                const { done, value } = await readStream.read();
                if (done) break;
                chunks.push(value);
              }

              mediaContent = concatUint8Arrays(chunks);
            } else if (media.body instanceof ArrayBuffer || media.body instanceof Uint8Array) {
              mediaContent = media.body;
            } else {
              mediaContent = new TextEncoder().encode(media.body);
            }
            
            const uploadResponse = await fetch(`${this.uploadUrl}/files/${fileId}?uploadType=media`, {
              method: 'PATCH',
              headers: {
                'Authorization': headers.Authorization,
                'Content-Type': media.mimeType
              },
              body: mediaContent
            });
  
            if (!uploadResponse.ok) {
              const uploadError = await uploadResponse.text();
              throw new Error(`Failed to upload file content: ${uploadError}`);
            }
            
            const getResponse = await fetch(`${this.baseUrl}/files/${fileId}`, {
              headers
            });
            
            return { data: await getResponse.json() };
          } catch (error) {
            console.error("Upload error:", error);
            throw error;
          }
        } else {
          const response = await fetch(`${this.baseUrl}/files`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
          });
  
          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create file: ${JSON.stringify(error)}`);
          }
  
          return { data: await response.json() };
        }
      },

      get: async (options) => {
        const headers = await this.authClient.getAuthHeaders();
        const { fileId, fields, alt } = options;
        
        let queryParams = new URLSearchParams();
        if (fields) queryParams.append('fields', fields);
        if (alt === 'media') queryParams.append('alt', 'media');
        
        const queryString = queryParams.toString();
        const url = `${this.baseUrl}/files/${fileId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url, { headers });

        if (!response.ok) {
          try {
            const error = await response.json();
            throw new Error(`Failed to get file: ${JSON.stringify(error)}`);
          } catch {
            throw new Error(`Failed to get file: ${response.statusText}`);
          }
        }
        
        // Return binary data or JSON based on what was requested
        if (alt === 'media') {
          return { data: await response.arrayBuffer() };
        } else {
          return { data: await response.json() };
        }
      },

      export: async (options, config) => {
        const headers = await this.authClient.getAuthHeaders();
        const { fileId, mimeType } = options;
        
        const response = await fetch(
          `${this.baseUrl}/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`, 
          { headers }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to export file: ${error}`);
        }
        
        // For text formats, return text
        if (mimeType === 'text/csv' || 
          mimeType === 'text/tab-separated-values' || 
          mimeType === 'text/html' || 
          mimeType === 'text/plain') {
        return { 
          data: await response.text()
        };
        }

        // For binary formats (Excel, PDF, ODS), return arrayBuffer
        return { 
          data: Buffer.from(await response.arrayBuffer())
        };
      },

      list: async (options) => {
        const headers = await this.authClient.getAuthHeaders();
        const { 
          pageSize, 
          pageToken, 
          q, 
          orderBy, 
          fields, 
          spaces,
          corpora,
          includeItemsFromAllDrives,
          supportsAllDrives 
        } = options;
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (pageSize) queryParams.append('pageSize', pageSize);
        if (pageToken) queryParams.append('pageToken', pageToken);
        if (q) queryParams.append('q', q);
        if (orderBy) queryParams.append('orderBy', orderBy);
        if (fields) queryParams.append('fields', fields);
        if (spaces) queryParams.append('spaces', spaces);
        if (corpora) queryParams.append('corpora', corpora);
        if (includeItemsFromAllDrives !== undefined) 
          queryParams.append('includeItemsFromAllDrives', includeItemsFromAllDrives);
        if (supportsAllDrives !== undefined) 
          queryParams.append('supportsAllDrives', supportsAllDrives);
        
        const queryString = queryParams.toString();
        const url = `${this.baseUrl}/files${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url, { headers });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to list files: ${JSON.stringify(error)}`);
        }

        return { data: await response.json() };
      },
    };
  }

  permissions() {
    return {
      create: async (options) => {
        const headers = await this.authClient.getAuthHeaders();
        const { fileId, requestBody } = options;
        
        const response = await fetch(`${this.baseUrl}/files/${fileId}/permissions`, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to create permission: ${JSON.stringify(error)}`);
        }

        return { data: await response.json() };
      },
    };
  }
}