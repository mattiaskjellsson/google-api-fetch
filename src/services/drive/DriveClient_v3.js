import { Readable } from 'stream';

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
      permissions: this.permissions()
    };
  }

  files() {
    return {
      create: async (options) => {
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
            if (media.body instanceof ReadableStream || media.body instanceof Readable) {
              const chunks = [];
              const readStream = media.body instanceof ReadableStream ? 
                media.body.getReader() : media.body;
              
              if (media.body instanceof ReadableStream) {
                while (true) {
                  const { done, value } = await readStream.read();
                  if (done) break;
                  chunks.push(value);
                }
              } else {
                for await (const chunk of readStream) {
                  chunks.push(Buffer.from(chunk));
                }
              }
              
              mediaContent = Buffer.concat(chunks);
            } else if (Buffer.isBuffer(media.body)) {
              mediaContent = media.body;
            } else {
              mediaContent = Buffer.from(media.body);
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
        const { fileId, fields } = options;
        
        const queryParams = fields ? `?fields=${encodeURIComponent(fields)}` : '';
        const response = await fetch(`${this.baseUrl}/files/${fileId}${queryParams}`, { headers });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to get file: ${JSON.stringify(error)}`);
        }

        return { data: await response.json() };
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

        return { 
          data: await response.arrayBuffer()
        };
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