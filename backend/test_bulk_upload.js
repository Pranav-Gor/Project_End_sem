const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const dotenv = require('dotenv');

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function testBulkUpload() {
  console.log('--- TESTING BULK UPLOAD ---');
  
  try {
    // 1. Get a token (assuming we can login or have a test user)
    // For simplicity, we might need a valid token. 
    // In this environment, we can't easily login without a real user, 
    // but we can check if the route is defined and reachable.
    
    const fd = new FormData();
    // Create a dummy buffer to simulate a file
    const buffer = Buffer.from('fake image content');
    fd.append('files', buffer, { filename: 'test1.jpg', contentType: 'image/jpeg' });
    fd.append('files', buffer, { filename: 'test2.jpg', contentType: 'image/jpeg' });
    
    console.log('Sending bulk upload request to /api/upload/bulk (expected to fail without Auth, but checking route exists)...');
    
    try {
      const res = await axios.post(`${API_BASE}/upload/bulk`, fd, {
        headers: fd.getHeaders()
      });
      console.log('✅ Bulk upload success (wait, did it work without auth?):', res.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✅ Route exists and is protected by Auth (401 Unauthorized as expected)');
      } else if (err.response) {
        console.error(`❌ Unexpected error ${err.response.status}:`, err.response.data);
      } else {
        console.error('❌ Request failed:', err.message);
      }
    }

  } catch (err) {
    console.error('Test Failed:', err.message);
  }
  
  console.log('---------------------------');
}

testBulkUpload();
