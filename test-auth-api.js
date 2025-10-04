// API Integration Test with Authentication
// This script will create a company and API key, then test all endpoints

const API_BASE_URL = 'http://localhost:5000/api';

async function testWithAuth() {
  try {
    console.log('🧪 Testing Kryos API with Authentication\n');

    // Step 1: Get or create a test company
    console.log('📝 Getting existing companies...');
    const companiesResponse = await fetch(`${API_BASE_URL}/companies`);
    const companiesData = await companiesResponse.json();
    
    let companyId;
    
    if (companiesData.success && companiesData.data.length > 0) {
      // Use the first existing company
      const company = companiesData.data[0];
      console.log('✅ Using existing company:', company.name);
      companyId = company._id;
    } else {
      // Create a new company with unique email
      const timestamp = Date.now();
      const companyResponse = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Security Company',
          email: `test-${timestamp}@security-company.com`,
          contactPerson: 'John Doe',
          description: 'Test company for API integration',
          website: 'https://test-company.com',
          phone: '+1-555-0123'
        })
      });

      const companyData = await companyResponse.json();
      
      if (!companyResponse.ok) {
        console.log('❌ Failed to create company:', companyData);
        return;
      }
      
      console.log('✅ Company created:', companyData.data.name);
      companyId = companyData.data._id;
    }

    // Step 2: Create an API key
    console.log('\n🔑 Creating API key...');
    const apiKeyResponse = await fetch(`${API_BASE_URL}/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dashboard Test Key',
        description: 'API key for testing dashboard integration',
        companyId: companyId,
        permissions: [
          'analytics:read',
          'security:read', 
          'security:write',
          'dashboard:read',
          'data:read',
          'data:write',
          'files:upload',
          'watchlist:read'
        ]
      })
    });

    const apiKeyData = await apiKeyResponse.json();
    
    if (!apiKeyResponse.ok) {
      console.log('❌ Failed to create API key:', apiKeyData);
      return;
    }
    
    console.log('✅ API key created:', apiKeyData.data.name);
    const apiKey = apiKeyData.data.apiKey;

    // Step 3: Test authenticated endpoints
    console.log('\n📊 Testing Analytics Endpoints:');
    await testEndpoint('/analytics/dashboard', 'GET', null, apiKey);
    await testEndpoint('/analytics/traffic?timeRange=7d', 'GET', null, apiKey);
    await testEndpoint('/analytics/users?timeRange=7d', 'GET', null, apiKey);

    console.log('\n🔒 Testing Security Endpoints:');
    await testEndpoint('/security/alerts', 'GET', null, apiKey);
    await testEndpoint('/security/alerts/metrics/dashboard', 'GET', null, apiKey);
    await testEndpoint('/security/alerts/metrics/types', 'GET', null, apiKey);

    console.log('\n📱 Testing Dashboard Endpoints:');
    await testEndpoint('/dashboard/monitoring', 'GET', null, apiKey);
    await testEndpoint('/dashboard/watchlist', 'GET', null, apiKey);

    console.log('\n📋 Testing Data Endpoints:');
    await testEndpoint('/data/users', 'GET', null, apiKey);
    await testEndpoint('/data/entries', 'GET', null, apiKey);
    await testEndpoint('/data/files', 'GET', null, apiKey);

    console.log('\n🎉 Authentication test completed successfully!');
    console.log(`\n💡 Use this API key in your dashboard: ${apiKey}`);
    console.log(`📋 Company ID: ${companyId}`);

  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
  }
}

async function testEndpoint(endpoint, method = 'GET', body = null, apiKey = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${method} ${endpoint}: ${response.status} ${response.statusText}`);
      if (data.data) {
        const keys = Object.keys(data.data);
        console.log(`   Response keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
      }
    } else {
      console.log(`❌ ${method} ${endpoint}: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: Network Error`);
    console.log(`   ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Backend is running on http://localhost:5000');
    return true;
  } catch (error) {
    console.log('❌ Backend is not running. Please start it first.');
    return false;
  }
}

// Main execution
(async () => {
  const backendRunning = await checkBackend();
  if (backendRunning) {
    await testWithAuth();
  }
})();