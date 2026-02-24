import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Load profiles
const profiles = {
  smoke: {
    stages: [
      { duration: '30s', target: 1 },
    ],
  },
  load: {
    stages: [
      { duration: '1m', target: 20 },
      { duration: '3m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },
  stress: {
    stages: [
      { duration: '2m', target: 50 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '1m', target: 0 },
    ],
  },
  spike: {
    stages: [
      { duration: '10s', target: 200 },
      { duration: '1m', target: 200 },
      { duration: '10s', target: 0 },
    ],
  },
};

// Select load profile
const loadProfile = __ENV.LOAD_PROFILE || 'smoke';
export const options = {
  ...profiles[loadProfile],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

// Test data
const testUsers = [
  { email: 'admin@horizon-hcm.com', password: 'Admin123!' },
  { email: 'manager@horizon-hcm.com', password: 'Manager123!' },
  { email: 'resident@horizon-hcm.com', password: 'Resident123!' },
];

export default function () {
  // Select random user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  // Test 1: Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login' },
    }
  );

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken !== undefined;
      } catch {
        return false;
      }
    },
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!loginSuccess);

  if (!loginSuccess) {
    console.error(`Login failed for ${user.email}: ${loginRes.status} ${loginRes.body}`);
    sleep(1);
    return;
  }

  // Extract token
  let token;
  try {
    const loginBody = JSON.parse(loginRes.body);
    token = loginBody.accessToken;
  } catch (e) {
    console.error('Failed to parse login response');
    errorRate.add(true);
    sleep(1);
    return;
  }

  sleep(1);

  // Test 2: Get current user profile
  const profileRes = http.get(`${BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    tags: { name: 'GetProfile' },
  });

  const profileSuccess = check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
    'profile returns user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.email === user.email;
      } catch {
        return false;
      }
    },
    'profile response time < 300ms': (r) => r.timings.duration < 300,
  });

  errorRate.add(!profileSuccess);

  sleep(1);

  // Test 3: Refresh token
  const refreshRes = http.post(
    `${BASE_URL}/api/auth/refresh`,
    null,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      tags: { name: 'RefreshToken' },
    }
  );

  const refreshSuccess = check(refreshRes, {
    'refresh status is 200': (r) => r.status === 200,
    'refresh returns new token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken !== undefined;
      } catch {
        return false;
      }
    },
    'refresh response time < 300ms': (r) => r.timings.duration < 300,
  });

  errorRate.add(!refreshSuccess);

  sleep(2);

  // Test 4: Logout
  const logoutRes = http.post(
    `${BASE_URL}/api/auth/logout`,
    null,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      tags: { name: 'Logout' },
    }
  );

  const logoutSuccess = check(logoutRes, {
    'logout status is 200 or 204': (r) => r.status === 200 || r.status === 204,
    'logout response time < 200ms': (r) => r.timings.duration < 200,
  });

  errorRate.add(!logoutSuccess);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += `${indent}✓ Authentication Load Test Results\n`;
  summary += `${indent}${'='.repeat(50)}\n\n`;

  // Metrics
  const metrics = data.metrics;
  
  if (metrics.http_req_duration) {
    summary += `${indent}Response Time:\n`;
    summary += `${indent}  avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  p95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  p99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
  }

  if (metrics.http_reqs) {
    summary += `${indent}Requests:\n`;
    summary += `${indent}  total: ${metrics.http_reqs.values.count}\n`;
    summary += `${indent}  rate: ${metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  }

  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `${indent}Error Rate: ${failRate}%\n\n`;
  }

  return summary;
}
