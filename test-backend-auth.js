// Test the auth API endpoints
const testUser = {
  name: "Test User",
  email: "test@example.com",
  password: "password123"
};

async function testAuthAPI() {
  const baseURL = 'http://localhost:5000/api';

  try {
    console.log('🧪 Testing Registration...');
    
    // Test registration
    const registerResponse = await fetch(`${baseURL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();
    console.log('✅ Registration response:', registerData);

    if (registerData.success) {
      const token = registerData.data.token;
      console.log('🔑 Token received:', token.substring(0, 20) + '...');

      // Test getting current user profile
      console.log('\n🧪 Testing Get Profile...');
      const profileResponse = await fetch(`${baseURL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const profileData = await profileResponse.json();
      console.log('✅ Profile response:', profileData);

      // Test login
      console.log('\n🧪 Testing Login...');
      const loginResponse = await fetch(`${baseURL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const loginData = await loginResponse.json();
      console.log('✅ Login response:', loginData);

    } else {
      console.log('❌ Registration failed:', registerData.message);
    }

  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

// Test health endpoint first
async function testHealth() {
  try {
    const response = await fetch('http://localhost:5000/health');
    const data = await response.json();
    console.log('💚 Health check:', data);
    return data.success;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  const healthOk = await testHealth();
  if (healthOk) {
    await testAuthAPI();
  } else {
    console.log('❌ Backend not healthy, skipping auth tests');
  }
  
  console.log('\n🏁 Tests completed');
}

runTests();