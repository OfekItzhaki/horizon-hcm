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
      { duration: '3m', target: 40 },
      { duration: '1m', target: 0 },
    ],
  },
  stress: {
    stages: [
      { duration: '2m', target: 40 },
      { duration: '5m', target: 80 },
      { duration: '2m', target: 150 },
      { duration: '1m', target: 0 },
    ],
  },
  spike: {
    stages: [
      { duration: '10s', target: 150 },
      { duration: '1m', target: 150 },
      { duration: '10s', target: 0 },
    ],
  },
};

// Select load profile
const loadProfile = __ENV.LOAD_PROFILE || 'smoke';
export const options = {
  ...profiles[loadProfile],
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

// Test credentials
const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'admin@horizon-hcm.com',
  password: __ENV.TEST_PASSWORD || 'Admin123!',
};

export function setup() {
  // Login once to get token
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(TEST_USER),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return { token: body.accessToken };
  }

  console.error('Setup failed: Could not authenticate');
  return { token: null };
}

export default function (data) {
  if (!data.token) {
    console.error('No auth token available');
    return;
  }

  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Test building IDs (replace with actual IDs from your test data)
  const buildingIds = [
    'building-1',
    'building-2',
    'building-3',
  ];
  const buildingId = buildingIds[Math.floor(Math.random() * buildingIds.length)];

  // Test 1: List Apartments
  const listRes = http.get(
    `${BASE_URL}/api/apartments?buildingId=${buildingId}&page=1&limit=20`,
    {
      headers,
      tags: { name: 'ListApartments' },
    }
  );

  const listSuccess = check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list has items': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.items);
      } catch {
        return false;
      }
    },
    'list has pagination': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.total !== undefined && body.page !== undefined;
      } catch {
        return false;
      }
    },
    'list response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!listSuccess);

  sleep(1);

  // Get a random apartment ID from the list
  let apartmentId = null;
  if (listSuccess && listRes.status === 200) {
    try {
      const body = JSON.parse(listRes.body);
      if (body.items && body.items.length > 0) {
        apartmentId = body.items[Math.floor(Math.random() * body.items.length)].id;
      }
    } catch (e) {
      console.error('Failed to parse apartment list');
    }
  }

  if (!apartmentId) {
    // Use a fallback apartment ID
    apartmentId = 'apartment-1';
  }

  // Test 2: Get Apartment Details
  const detailsRes = http.get(
    `${BASE_URL}/api/apartments/${apartmentId}`,
    {
      headers,
      tags: { name: 'GetApartment' },
    }
  );

  const detailsSuccess = check(detailsRes, {
    'details status is 200': (r) => r.status === 200,
    'details has apartment data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id === apartmentId;
      } catch {
        return false;
      }
    },
    'details response time < 400ms': (r) => r.timings.duration < 400,
  });

  errorRate.add(!detailsSuccess);

  sleep(1);

  // Test 3: Get Apartment Owners
  const ownersRes = http.get(
    `${BASE_URL}/api/apartments/${apartmentId}/owners`,
    {
      headers,
      tags: { name: 'GetOwners' },
    }
  );

  const ownersSuccess = check(ownersRes, {
    'owners status is 200': (r) => r.status === 200,
    'owners returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
    'owners response time < 400ms': (r) => r.timings.duration < 400,
  });

  errorRate.add(!ownersSuccess);

  sleep(1);

  // Test 4: Get Apartment Tenants
  const tenantsRes = http.get(
    `${BASE_URL}/api/apartments/${apartmentId}/tenants`,
    {
      headers,
      tags: { name: 'GetTenants' },
    }
  );

  const tenantsSuccess = check(tenantsRes, {
    'tenants status is 200': (r) => r.status === 200,
    'tenants returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
    'tenants response time < 400ms': (r) => r.timings.duration < 400,
  });

  errorRate.add(!tenantsSuccess);

  sleep(1);

  // Test 5: Search Apartments
  const searchRes = http.get(
    `${BASE_URL}/api/apartments?buildingId=${buildingId}&isVacant=true&page=1&limit=10`,
    {
      headers,
      tags: { name: 'SearchApartments' },
    }
  );

  const searchSuccess = check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search has results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.items !== undefined;
      } catch {
        return false;
      }
    },
    'search response time < 600ms': (r) => r.timings.duration < 600,
  });

  errorRate.add(!searchSuccess);

  sleep(2);
}

export function handleSummary(data) {
  const metrics = data.metrics;
  
  let summary = '\n';
  summary += '✓ Apartments Load Test Results\n';
  summary += '='.repeat(50) + '\n\n';

  if (metrics.http_req_duration) {
    summary += 'Response Time:\n';
    summary += `  avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `  min: ${metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
    summary += `  max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
    summary += `  p95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `  p99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
  }

  if (metrics.http_reqs) {
    summary += 'Requests:\n';
    summary += `  total: ${metrics.http_reqs.values.count}\n`;
    summary += `  rate: ${metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  }

  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    const failed = Math.round(metrics.http_req_failed.values.passes);
    const total = metrics.http_reqs.values.count;
    summary += `Error Rate: ${failRate}% (${failed}/${total} failed)\n\n`;
  }

  if (metrics.vus) {
    summary += 'Virtual Users:\n';
    summary += `  min: ${metrics.vus.values.min}\n`;
    summary += `  max: ${metrics.vus.values.max}\n\n`;
  }

  // Threshold results
  summary += 'Threshold Results:\n';
  const thresholds = data.thresholds || {};
  Object.keys(thresholds).forEach(name => {
    const threshold = thresholds[name];
    const status = threshold.ok ? '✓' : '✗';
    summary += `  ${status} ${name}\n`;
  });

  return { 'stdout': summary };
}
