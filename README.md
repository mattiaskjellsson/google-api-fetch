# google-api-fetch
A lightweight implementation of Google API client using fetch for edge environments like Cloudflare Workers, Deno, and browsers.

## Features
* Zero dependencies
* Built for edge computing environments
* Supports Google Drive, Docs, and Sheets APIs
* Service account authentication
* Fetch API-based HTTP requests
* API compatible with the official googleapis package
* Built-in rate limiting for API requests

## Installation
``` 
npm install google-api-fetch
``` bash

## Usage
Basic setup 

```javascript
import GoogleApi from 'google-api-fetch';

// Service account credentials
const credentials = {
  client_email: 'your-service-account@project-id.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\n...your key...\n-----END PRIVATE KEY-----\n'
};

// Create a Google API client instance
const googleApi = new GoogleApi(credentials, {
  enableRateLimiting: true,
  maxConcurrentRequests: 5,
  requestIntervalMs: 100
});
```

Drive API
```javascript
// Initialize Drive API
const drive = googleApi.drive();

// List files
const filesList = await drive.files.list({
  pageSize: 10,
  fields: 'files(id, name, mimeType)'
});

// Get a file
const file = await drive.files.get({
  fileId: 'your-file-id'
});

// Create a file
const newFile = await drive.files.create({
  requestBody: {
    name: 'My Document',
    mimeType: 'application/vnd.google-apps.document'
  },
  media: {
    mimeType: 'text/plain',
    body: 'Hello, World!'
  }
});

// Export a file to a different format
const exportedFile = await drive.files.export({
  fileId: 'google-doc-id',
  mimeType: 'application/pdf'
});
```

Sheets API
```javascript
// Initialize Sheets API
const sheets = googleApi.sheets();

// Get a spreadsheet
const spreadsheet = await sheets.spreadsheets.get({
  spreadsheetId: 'your-spreadsheet-id'
});

// Get values from a range
const values = await sheets.spreadsheets.values.get({
  spreadsheetId: 'your-spreadsheet-id',
  range: 'Sheet1!A1:D10'
});

// Update values in a range
const updateResult = await sheets.spreadsheets.values.update({
  spreadsheetId: 'your-spreadsheet-id',
  range: 'Sheet1!A1:D1',
  valueInputOption: 'RAW',
  resource: {
    values: [['Value1', 'Value2', 'Value3', 'Value4']]
  }
});
```

Docs API
```javascript
// Initialize Docs API
const docs = googleApi.docs();

// Get a document
const document = await docs.documents.get({
  documentId: 'your-document-id'
});

// Create a document
const newDocument = await docs.documents.create({
  requestBody: {
    title: 'New Document'
  }
});

// Update a document
const updateResult = await docs.documents.batchUpdate({
  documentId: 'your-document-id',
  requestBody: {
    requests: [
      {
        insertText: {
          location: {
            index: 1
          },
          text: 'Hello World!'
        }
      }
    ]
  }
});
```