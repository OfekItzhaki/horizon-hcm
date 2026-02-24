#!/usr/bin/env node

/**
 * API Client SDK Generation Script
 * This script generates a TypeScript SDK from the OpenAPI/Swagger specification
 * Cross-platform Node.js version
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const SWAGGER_JSON_URL = `${API_URL}/api/docs-json`;
const OUTPUT_DIR = path.join(__dirname, '../../shared/api-client');
const TEMP_DIR = path.join(__dirname, '../../temp-openapi');

// Colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

function checkServerRunning() {
  return new Promise((resolve) => {
    const protocol = API_URL.startsWith('https') ? https : http;
    const url = new URL(`${API_URL}/health`);

    const req = protocol.get(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        timeout: 5000,
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  try {
    log('🚀 Generating API Client SDK...', 'green');

    // Check if server is running
    log(`📡 Checking if API server is running at ${API_URL}...`);
    const isRunning = await checkServerRunning();

    if (!isRunning) {
      log(`❌ Error: API server is not running at ${API_URL}`, 'red');
      log('Please start the server with: npm run start:dev');
      process.exit(1);
    }

    log('✅ API server is running', 'green');

    // Create temp directory
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Download OpenAPI spec
    log('📥 Downloading OpenAPI specification...');
    const specPath = path.join(TEMP_DIR, 'openapi.json');

    try {
      await downloadFile(SWAGGER_JSON_URL, specPath);
    } catch (error) {
      log(`❌ Error: Failed to download OpenAPI spec: ${error.message}`, 'red');
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      process.exit(1);
    }

    if (!fs.existsSync(specPath) || fs.statSync(specPath).size === 0) {
      log('❌ Error: Downloaded spec is empty', 'red');
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      process.exit(1);
    }

    log('✅ OpenAPI spec downloaded', 'green');

    // Check if openapi-generator-cli is installed
    log('🔍 Checking for openapi-generator-cli...');
    try {
      execSync('openapi-generator-cli version', { stdio: 'ignore' });
      log('✅ openapi-generator-cli found', 'green');
    } catch (error) {
      log('⚠️  openapi-generator-cli not found. Installing...', 'yellow');
      try {
        execSync('npm install -g @openapitools/openapi-generator-cli', {
          stdio: 'inherit',
        });
        log('✅ openapi-generator-cli installed', 'green');
      } catch (installError) {
        log('❌ Error: Failed to install openapi-generator-cli', 'red');
        log('Please install manually: npm install -g @openapitools/openapi-generator-cli');
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        process.exit(1);
      }
    }

    // Clean output directory
    log('🧹 Cleaning output directory...');
    if (fs.existsSync(OUTPUT_DIR)) {
      fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Generate TypeScript SDK
    log('⚙️  Generating TypeScript SDK...');
    try {
      execSync(
        `openapi-generator-cli generate -i "${specPath}" -g typescript-axios -o "${OUTPUT_DIR}" --additional-properties=supportsES6=true,npmName=@horizon-hcm/api-client,npmVersion=1.0.0,withSeparateModelsAndApi=true,apiPackage=api,modelPackage=models`,
        { stdio: 'inherit' }
      );
      log('✅ SDK generated successfully', 'green');
    } catch (error) {
      log('❌ Error: SDK generation failed', 'red');
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      process.exit(1);
    }

    // Copy OpenAPI spec to output directory
    fs.copyFileSync(specPath, path.join(OUTPUT_DIR, 'openapi.json'));

    // Create README
    log('📝 Creating README...');
    const readmeContent = `# Horizon-HCM API Client SDK

Type-safe TypeScript client for the Horizon-HCM API.

## Installation

\`\`\`bash
npm install @horizon-hcm/api-client
# or
yarn add @horizon-hcm/api-client
\`\`\`

## Usage

### Basic Setup

\`\`\`typescript
import { Configuration, ApartmentsApi, AuthApi } from '@horizon-hcm/api-client';

// Configure the client
const config = new Configuration({
  basePath: 'http://localhost:3001',
  accessToken: 'your-jwt-token',
});

// Create API instances
const apartmentsApi = new ApartmentsApi(config);
const authApi = new AuthApi(config);
\`\`\`

### Authentication

\`\`\`typescript
import { AuthApi } from '@horizon-hcm/api-client';

const authApi = new AuthApi();

// Login
const response = await authApi.login({
  email: 'user@example.com',
  password: 'password123',
});

const { accessToken } = response.data;

// Use token for authenticated requests
const config = new Configuration({
  basePath: 'http://localhost:3001',
  accessToken: accessToken,
});
\`\`\`

### Making Requests

\`\`\`typescript
import { ApartmentsApi, CreateApartmentDto } from '@horizon-hcm/api-client';

const apartmentsApi = new ApartmentsApi(config);

// List apartments
const apartments = await apartmentsApi.listApartments('building-id', 1, 10);

// Create apartment
const newApartment: CreateApartmentDto = {
  apartmentNumber: '101',
  buildingId: 'building-id',
  floor: 1,
  size: 85.5,
};

const created = await apartmentsApi.createApartment(newApartment);

// Get apartment details
const apartment = await apartmentsApi.getApartment('apartment-id');

// Update apartment
await apartmentsApi.updateApartment('apartment-id', {
  size: 90.0,
});

// Delete apartment
await apartmentsApi.deleteApartment('apartment-id');
\`\`\`

### Error Handling

\`\`\`typescript
import { AxiosError } from 'axios';

try {
  const apartment = await apartmentsApi.getApartment('invalid-id');
} catch (error) {
  if (error instanceof AxiosError) {
    console.error('API Error:', error.response?.data);
    console.error('Status:', error.response?.status);
  }
}
\`\`\`

### React Integration

\`\`\`typescript
import { useState, useEffect } from 'react';
import { Configuration, ApartmentsApi } from '@horizon-hcm/api-client';

function ApartmentsList() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApartments = async () => {
      const config = new Configuration({
        basePath: 'http://localhost:3001',
        accessToken: localStorage.getItem('token'),
      });

      const api = new ApartmentsApi(config);
      const response = await api.listApartments('building-id');
      setApartments(response.data.items);
      setLoading(false);
    };

    fetchApartments();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {apartments.map((apt) => (
        <li key={apt.id}>{apt.apartmentNumber}</li>
      ))}
    </ul>
  );
}
\`\`\`

### Custom Axios Instance

\`\`\`typescript
import axios from 'axios';
import { Configuration, ApartmentsApi } from '@horizon-hcm/api-client';

// Create custom axios instance with interceptors
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001',
});

// Add request interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Use custom instance
const config = new Configuration({
  basePath: 'http://localhost:3001',
});

const apartmentsApi = new ApartmentsApi(config, undefined, axiosInstance);
\`\`\`

## Available APIs

- \`AuthApi\` - Authentication endpoints
- \`ApartmentsApi\` - Apartment management
- \`BuildingsApi\` - Building management
- \`ResidentsApi\` - Resident management
- \`ReportsApi\` - Financial reports
- \`PaymentsApi\` - Payment processing
- \`AnnouncementsApi\` - Announcements
- \`DocumentsApi\` - Document management
- \`InvoicesApi\` - Invoice management
- \`MessagesApi\` - Messaging system
- \`NotificationsApi\` - Notifications
- \`PollsApi\` - Polls and voting

## Type Safety

All request and response types are fully typed:

\`\`\`typescript
import { 
  CreateApartmentDto, 
  UpdateApartmentDto, 
  ApartmentResponseDto 
} from '@horizon-hcm/api-client';

// TypeScript will enforce correct types
const dto: CreateApartmentDto = {
  apartmentNumber: '101', // ✅ Correct
  buildingId: 'building-id',
  floor: 1,
  // size: '85.5', // ❌ Error: Type 'string' is not assignable to type 'number'
};
\`\`\`

## Configuration Options

\`\`\`typescript
const config = new Configuration({
  basePath: 'http://localhost:3001',
  accessToken: 'your-jwt-token',
  apiKey: 'your-api-key', // If using API key auth
  username: 'user', // If using basic auth
  password: 'pass',
  baseOptions: {
    headers: {
      'X-Custom-Header': 'value',
    },
    timeout: 5000,
  },
});
\`\`\`

## Development

### Regenerate SDK

To regenerate the SDK after API changes:

\`\`\`bash
cd backend
npm run generate:sdk
\`\`\`

### Update Package

After regenerating, update the package version and publish:

\`\`\`bash
cd shared/api-client
npm version patch
npm publish
\`\`\`

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readmeContent);
    log('✅ README created', 'green');

    // Update package.json if needed
    const packageJsonPath = path.join(OUTPUT_DIR, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.name = '@horizon-hcm/api-client';
      packageJson.description = 'Type-safe TypeScript client for Horizon-HCM API';
      packageJson.keywords = ['horizon-hcm', 'api-client', 'typescript', 'axios'];
      packageJson.author = 'Horizon-HCM Team';
      packageJson.license = 'MIT';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      log('✅ package.json updated', 'green');
    }

    // Clean up temp directory
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    log('');
    log('✨ SDK generation complete!', 'green');
    log('');
    log(`📁 Output directory: ${OUTPUT_DIR}`);
    log('');
    log('Next steps:');
    log(`  1. cd ${OUTPUT_DIR}`);
    log('  2. npm install');
    log('  3. npm run build');
    log('  4. npm publish (to publish to npm registry)');
    log('');
    log('Or use locally:');
    log('  cd frontend');
    log('  npm install ../shared/api-client');
    log('');
  } catch (error) {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
