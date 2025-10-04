// API Test Script for Kryos Backend
// Run this with: node test-api.js

const API_BASE_URL = 'http://localhost:5000/api';

// Mock API key for testing (you'll need to replace this with a real one)
const TEST_API_KEY = 'test-api-key';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_API_KEY}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ ${method} ${endpoint}:`, response.status, response.statusText);
    if (!response.ok) {
      console.log('   Error:', data);
    } else {
      console.log('   Success:', Object.keys(data));
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Kryos Backend API Endpoints\n');

  // Test health endpoint (should work without auth)
  await testEndpoint('/data/health');
  
  console.log('\n📊 Analytics Endpoints:');
  await testEndpoint('/analytics/dashboard');
  await testEndpoint('/analytics/traffic?timeRange=7d');
  await testEndpoint('/analytics/users?timeRange=7d');
  
  console.log('\n🔒 Security Endpoints:');
  await testEndpoint('/security/alerts');
  await testEndpoint('/security/alerts?status=new&severity=high');
  await testEndpoint('/security/alerts/metrics/dashboard');
  await testEndpoint('/security/alerts/metrics/types');
  
  console.log('\n📱 Dashboard Endpoints:');
  await testEndpoint('/dashboard/monitoring');
  await testEndpoint('/dashboard/watchlist');
  
  console.log('\n🔑 API Key Endpoints:');
  await testEndpoint('/api-keys');
  
  console.log('\n🏢 Company Endpoints:');
  await testEndpoint('/companies');
  
  console.log('\n📋 Data Endpoints:');
  await testEndpoint('/data/users');
  await testEndpoint('/data/entries');
  await testEndpoint('/data/files');
  
  console.log('\n🎯 Test completed!');
}

// Check if backend is running first
async function checkBackend() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    if (response.ok) {
      console.log('✅ Backend is running on http://localhost:5000');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend is not running. Please start it with: cd backend && npm run dev');
    console.log('   Error:', error.message);
    return false;
  }
}

// Main execution
(async () => {
  const backendRunning = await checkBackend();
  if (backendRunning) {
    await runTests();
  } else {
    console.log('\n💡 To start the backend:');
    console.log('   cd d:\\Kryos\\backend');
    console.log('   npm run dev');
    console.log('\n💡 Then run this test again:');
    console.log('   node test-api.js');
  }
})();