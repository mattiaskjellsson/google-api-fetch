import crypto from 'crypto';

export default class AuthClient {
  constructor({credentials}) {
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Service account credentials must include client_email and private_key');
    }
    
    this.credentials = credentials;
    this.token = null;
    this.tokenExpiry = 0;
  }

  async getAccessToken() {
    if (this.token && Date.now() < this.tokenExpiry - 60000) {
      return this.token;
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      const expiryTime = now + 3600;
      
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      };
      
      const payload = {
        iss: this.credentials.client_email,
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents',
        aud: 'https://oauth2.googleapis.com/token',
        exp: expiryTime,
        iat: now
      };
      
      const signedJwt = await this.createSignedJwt(header, payload, this.credentials.private_key);
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: signedJwt
        }).toString()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Authentication failed: ${JSON.stringify(error)}`);
      }

      const tokenData = await response.json();
      this.token = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
      
      return this.token;
    } catch (error) {
      console.error('Failed to obtain access token:', error);
      throw error;
    }
  }

  async createSignedJwt(header, payload, privateKey) {
    const base64Url = (str) => {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    };
    
    const headerEncoded = base64Url(JSON.stringify(header));
    const payloadEncoded = base64Url(JSON.stringify(payload));
    
    const toSign = `${headerEncoded}.${payloadEncoded}`;
    const privateKeyFormatted = this.formatPrivateKey(privateKey);
    
    const keyData = await this.importPrivateKey(privateKeyFormatted);
    const signature = await this.signData(toSign, keyData);
    
    return `${toSign}.${signature}`;
  }

  formatPrivateKey(privateKey) {
    return privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s+/g, '');
  }
  
  async importPrivateKey(privateKeyBase64) {
    const binaryString = atob(privateKeyBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return await crypto.subtle.importKey(
      'pkcs8',
      bytes.buffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: {name: 'SHA-256'},
      },
      false,
      ['sign']
    );
  }
  
  async signData(data, key) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    const signature = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      key,
      encodedData
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async getAuthHeaders() {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  async getRequestHeaders() {
    return this.getAuthHeaders();
  }
}