import GoogleApi from '../src/index.js';

describe('GoogleApi', () => {
  it('should require credentials', () => {
    expect(() => {
      new GoogleApi();
    }).toThrow(new Error('Credentials required'));
  });

  it('should create an instance with valid credentials', () => {
    const credentials = { 
      client_email: 'test@example.com', 
      private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n' 
    };

    const api = new GoogleApi(credentials);
    expect(api).toBeDefined();
    expect(api.credentials).toBe(credentials);
  });

  it('should throw error if required credentials are not supplied', () => {
    const credentials = {
      user: 'admin',
      password: 'admin'
    };
    
    expect(() => {
      new GoogleApi(credentials);
    }).toThrow(new Error('Service account credentials must include client_email and private_key'));
  });
});