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
      { duration: '1m', target: 15 },
      { duration: '3m', target: 30 },
      { duration: '1m', target: 0 },
    ],
  },
  stress: {
    stages: [
      { duration: '2m', target: 30 },
      { duration: '5m', target: 60 },
      { duration: '2m', target: 100 },
      { duration: '1m', target: 0 },
    ],
  },
  spike: {
    stages: [
      { duration: '10s', target: 100 },
      { duration: '1m', target: 100 },
      { duration: '10s', target: 0 },
    ],
  },
};

// Select load profile
const loadProfile = __ENV.LOAD_PROFILE || 'smoke';
export const options = {
  ...profiles[loadProfile],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // Reports can be slower
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

// Test credentials
const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'admin@horizon-hcm.com',
  password: __ENV.TEST_PASSWORD || 'Admin123!',
};

// Shared token (setup once)
let authToken = null;

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

  // Test 1: Get Building Balance
  const balanceRes = http.get(
    `${BASE_URL}/api/reports/buildings/${buildingId}/balance`,
    {
      headers,
      tags: { name: 'GetBuildingBalance' },
    }
  );

  const balanceSuccess = check(balanceRes, {
    'balance status is 200': (r) => r.status === 200,
    'balance has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.balance !== undefined;
      } catch {
        return false;
      }
    },
    'balance response time < 800ms': (r) => r.timings.duration < 800,
  });

  errorRate.add(!balanceSuccess);

  sleep(1);

  // Test 2: Get Income Report
  const currentYear = new Date().getFullYear();
  const incomeRes = http.get(
    `${BASE_URL}/api/reports/buildings/${buildingId}/income?year=${currentYear}`,
    {
      headers,
      tags: { name: 'GetIncomeReport' },
    }
  );

  const incomeSuccess = check(incomeRes, {
    'income status is 200': (r) => r.status === 200,
    'income has monthly data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.monthlyIncome);
      } catch {
        return false;
      }
    },
    'income response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!incomeSuccess);

  sleep(1);

  // Test 3: Get Expense Report
  const expenseRes = http.get(
    `${BASE_URL}/api/reports/buildings/${buildingId}/expenses?year=${currentYear}`,
    {
      headers,
      tags: { name: 'GetExpenseReport' },
    }
  );

  const expenseSuccess = check(expenseRes, {
    'expense status is 200': (r) => r.status === 200,
    'expense has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.totalExpenses !== undefined;
      } catch {
        return false;
      }
    },
    'expense response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!expenseSuccess);

  sleep(1);

  // Test 4: Get Transaction History
  const transactionsRes = http.get(
    `${BASE_URL}/api/reports/buildings/${buildingId}/transactions?page=1&limit=20`,
    {
      headers,
      tags: { name: 'GetTransactions' },
    }
  );

  const transactionsSuccess = check(transactionsRes, {
    'transactions status is 200': (r) => r.status === 200,
    'transactions has items': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.items);
      } catch {
        return false;
      }
    },
    'transactions response time < 800ms': (r) => r.timings.duration < 800,
  });

  errorRate.add(!transactionsSuccess);

  sleep(2);

  // Test 5: Export Financial Report (CSV)
  const exportRes = http.post(
    `${BASE_URL}/api/reports/buildings/${buildingId}/export`,
    JSON.stringify({
      format: 'csv',
      reportType: 'financial',
      year: currentYear,
    }),
    {
      headers,
      tags: { name: 'ExportReport' },
    }
  );

  const exportSuccess = check(exportRes, {
    'export status is 200': (r) => r.status === 200,
    'export returns URL': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.downloadUrl !== undefined;
      } catch {
        return false;
      }
    },
    'export response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!exportSuccess);

  sleep(2);
}

export function handleSummary(data) {
  const metrics = data.metrics;
  
  let summary = '\n';
  summary += '✓ Reports Load Test Results\n';
  summary += '='.repeat(50) + '\n\n';

  if (metrics.http_req_duration) {
    summary += 'Response Time:\n';
    summary += `  avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
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
    summary += `Error Rate: ${failRate}%\n\n`;
  }

  // Per-endpoint breakdown
  summary += 'Endpoint Performance:\n';
  const groups = data.root_group.groups || {};
  Object.keys(groups).forEach(name => {
    const group = groups[name];
    if (group.checks) {
      const passed = Object.values(group.checks).filter(c => c.passes > 0).length;
      const total = Object.keys(group.checks).length;
      summary += `  ${name}: ${passed}/${total} checks passed\n`;
    }
  });

  return { 'stdout': summary };
}
