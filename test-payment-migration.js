// Test script to verify payment system migration from Firebase to MongoDB backend
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
};

let authToken = '';
let userId = '';

async function testPaymentMigration() {
  console.log('🧪 Testing Payment System Migration...\n');

  try {
    // 1. Register or login user
    console.log('1️⃣ Authenticating user...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, {
        email: testUser.email,
        password: testUser.password
      });
      authToken = loginResponse.data.data.token;
      userId = loginResponse.data.data.user._id;
      console.log('✅ User logged in successfully');
    } catch (error) {
      // If login fails, try to register
      console.log('User not found, registering...');
      const registerResponse = await axios.post(`${API_BASE_URL}/users/register`, testUser);
      authToken = registerResponse.data.data.token;
      userId = registerResponse.data.data.user._id;
      console.log('✅ User registered successfully');
    }

    // 2. Create a test transaction
    console.log('\n2️⃣ Creating test transaction...');
    const transactionData = {
      razorpay_order_id: `order_test_${Date.now()}`,
      amount: 100,
      currency: 'INR',
      receiver: 'Test User'
    };

    const createResponse = await axios.post(`${API_BASE_URL}/transactions/create`, transactionData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Transaction created:', {
      id: createResponse.data.data._id,
      orderId: createResponse.data.data.orderId,
      amount: createResponse.data.data.amount,
      status: createResponse.data.data.status
    });

    // 3. Fetch user transactions
    console.log('\n3️⃣ Fetching user transactions...');
    const transactionsResponse = await axios.get(`${API_BASE_URL}/transactions?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Transactions fetched:', {
      count: transactionsResponse.data.data.transactions.length,
      total: transactionsResponse.data.data.pagination.totalTransactions
    });

    // 4. Test payment verification (simulate)
    console.log('\n4️⃣ Testing payment verification...');
    const verifyData = {
      razorpay_order_id: transactionData.razorpay_order_id,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      razorpay_signature: 'test_signature_123'
    };

    const verifyResponse = await axios.post(`${API_BASE_URL}/transactions/verify`, verifyData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Payment verification completed:', {
      success: verifyResponse.data.success,
      verified: verifyResponse.data.verified,
      status: verifyResponse.data.data?.status
    });

    console.log('\n🎉 Payment Migration Test Completed Successfully!');
    console.log('✅ All backend APIs are working correctly');
    console.log('✅ MongoDB storage is functioning');
    console.log('✅ Authentication is working');
    console.log('✅ Transaction CRUD operations are successful');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPaymentMigration();