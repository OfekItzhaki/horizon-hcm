const axios = require('axios');

const API_URL = 'http://localhost:3001';

// You'll need to replace these with actual values
const TEST_USER_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Get from login
const TEST_BUILDING_ID = '1'; // Replace with actual building ID

async function testPushNotifications() {
  console.log('🧪 Testing Push Notifications\n');

  try {
    // Step 1: Register a test push token
    console.log('1️⃣  Registering push token...');
    const registerResponse = await axios.post(
      `${API_URL}/notifications/push-token`,
      {
        token: 'ExponentPushToken[test-token-' + Date.now() + ']',
        platform: 'expo',
        deviceName: 'Test Device',
      },
      {
        headers: {
          Authorization: `Bearer ${TEST_USER_TOKEN}`,
        },
      }
    );
    console.log('✅ Push token registered:', registerResponse.data);

    // Step 2: Create a test poll (should trigger notification)
    console.log('\n2️⃣  Creating test poll...');
    const pollResponse = await axios.post(
      `${API_URL}/buildings/${TEST_BUILDING_ID}/polls`,
      {
        title: 'Test Poll - Push Notification',
        description: 'This is a test poll to verify push notifications',
        options: ['Option A', 'Option B', 'Option C'],
        allowMultiple: false,
        isAnonymous: false,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      },
      {
        headers: {
          Authorization: `Bearer ${TEST_USER_TOKEN}`,
        },
      }
    );
    console.log('✅ Poll created:', pollResponse.data);

    // Step 3: Check notifications
    console.log('\n3️⃣  Checking notifications...');
    const notificationsResponse = await axios.get(
      `${API_URL}/notifications?page=1&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${TEST_USER_TOKEN}`,
        },
      }
    );
    console.log('✅ Notifications:', JSON.stringify(notificationsResponse.data, null, 2));

    // Step 4: Check unread count
    console.log('\n4️⃣  Checking unread count...');
    const unreadResponse = await axios.get(
      `${API_URL}/notifications/unread-count`,
      {
        headers: {
          Authorization: `Bearer ${TEST_USER_TOKEN}`,
        },
      }
    );
    console.log('✅ Unread count:', unreadResponse.data);

    // Step 5: Mark first notification as read
    if (notificationsResponse.data.data.length > 0) {
      const firstNotificationId = notificationsResponse.data.data[0].id;
      console.log('\n5️⃣  Marking notification as read...');
      const markReadResponse = await axios.patch(
        `${API_URL}/notifications/${firstNotificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${TEST_USER_TOKEN}`,
          },
        }
      );
      console.log('✅ Marked as read:', markReadResponse.data);

      // Check unread count again
      const unreadResponse2 = await axios.get(
        `${API_URL}/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${TEST_USER_TOKEN}`,
          },
        }
      );
      console.log('✅ New unread count:', unreadResponse2.data);
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: You need to update TEST_USER_TOKEN with a valid JWT token');
      console.log('   Get a token by logging in through the API or web app');
    }
  }
}

// Instructions
console.log('📝 Before running this test:');
console.log('1. Make sure the backend is running on http://localhost:3001');
console.log('2. Update TEST_USER_TOKEN with a valid JWT token');
console.log('3. Update TEST_BUILDING_ID with a valid building ID');
console.log('4. Run: node scripts/test-push-notifications.js\n');

// Uncomment to run the test
// testPushNotifications();

module.exports = { testPushNotifications };
