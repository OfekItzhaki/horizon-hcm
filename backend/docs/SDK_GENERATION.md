# API Client SDK Generation Guide

This guide explains how to generate and use the type-safe TypeScript SDK for the Horizon-HCM API.

## Overview

The SDK is automatically generated from the OpenAPI/Swagger specification using `openapi-generator-cli`. It provides:

- **Type Safety**: Full TypeScript support with auto-generated types
- **Auto-completion**: IntelliSense support in IDEs
- **Axios-based**: Uses Axios for HTTP requests
- **Modular**: Separate API classes for each module
- **Documented**: Includes JSDoc comments from OpenAPI spec

## Prerequisites

1. **API Server Running**: The backend server must be running to download the OpenAPI spec
2. **Node.js**: Version 18+ required
3. **OpenAPI Generator CLI**: Will be installed automatically if not present

## Quick Start

### 1. Generate the SDK

```bash
cd backend
npm run generate:sdk
```

This will:
- Check if the API server is running
- Download the OpenAPI specification
- Generate TypeScript SDK using openapi-generator-cli
- Create README and package.json
- Output to `shared/api-client/` directory

### 2. Install Dependencies

```bash
cd ../shared/api-client
npm install
```

### 3. Build the SDK

```bash
npm run build
```

### 4. Use in Frontend

```bash
cd ../../frontend
npm install ../shared/api-client
```

## Manual Generation

If you need more control over the generation process:

### Using the Bash Script (Linux/Mac)

```bash
cd backend
bash scripts/generate-sdk.sh
```

### Using the Node.js Script (Cross-platform)

```bash
cd backend
node scripts/generate-sdk.js
```

### Custom Configuration

You can customize the generation by setting environment variables:

```bash
# Use a different API URL
API_URL=https://api.example.com npm run generate:sdk

# Or export it
export API_URL=https://api.example.com
npm run generate:sdk
```

## SDK Structure

After generation, the SDK will have the following structure:

```
shared/api-client/
├── api/                    # API classes
│   ├── apartments-api.ts
│   ├── auth-api.ts
│   ├── buildings-api.ts
│   ├── reports-api.ts
│   └── ...
├── models/                 # Type definitions
│   ├── create-apartment-dto.ts
│   ├── apartment-response-dto.ts
│   └── ...
├── base.ts                 # Base configuration
├── common.ts               # Common types
├── configuration.ts        # Configuration class
├── index.ts                # Main export
├── openapi.json           # OpenAPI specification
├── package.json
├── README.md
└── tsconfig.json
```

## Usage Examples

### Basic Setup

```typescript
import { Configuration, ApartmentsApi } from '@horizon-hcm/api-client';

const config = new Configuration({
  basePath: 'http://localhost:3001',
  accessToken: 'your-jwt-token',
});

const apartmentsApi = new ApartmentsApi(config);
```

### Authentication Flow

```typescript
import { AuthApi, Configuration, ApartmentsApi } from '@horizon-hcm/api-client';

// Step 1: Login
const authApi = new AuthApi();
const loginResponse = await authApi.login({
  email: 'user@example.com',
  password: 'password123',
});

const { accessToken } = loginResponse.data;

// Step 2: Use token for authenticated requests
const config = new Configuration({
  basePath: 'http://localhost:3001',
  accessToken: accessToken,
});

const apartmentsApi = new ApartmentsApi(config);
const apartments = await apartmentsApi.listApartments('building-id');
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { Configuration, ApartmentsApi, ApartmentResponseDto } from '@horizon-hcm/api-client';

function useApartments(buildingId: string) {
  const [apartments, setApartments] = useState<ApartmentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const config = new Configuration({
          basePath: process.env.REACT_APP_API_URL,
          accessToken: localStorage.getItem('token') || undefined,
        });

        const api = new ApartmentsApi(config);
        const response = await api.listApartments(buildingId);
        setApartments(response.data.items);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchApartments();
  }, [buildingId]);

  return { apartments, loading, error };
}

// Usage in component
function ApartmentsList({ buildingId }: { buildingId: string }) {
  const { apartments, loading, error } = useApartments(buildingId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {apartments.map((apt) => (
        <li key={apt.id}>{apt.apartmentNumber}</li>
      ))}
    </ul>
  );
}
```

### Custom Axios Instance with Interceptors

```typescript
import axios, { AxiosError } from 'axios';
import { Configuration, ApartmentsApi } from '@horizon-hcm/api-client';

// Create custom axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000,
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Show permission error
      console.error('Permission denied');
    } else if (error.response?.status >= 500) {
      // Show server error
      console.error('Server error');
    }
    return Promise.reject(error);
  }
);

// Use custom instance with SDK
const config = new Configuration({
  basePath: 'http://localhost:3001',
});

const apartmentsApi = new ApartmentsApi(config, undefined, axiosInstance);
```

## Publishing to NPM

### 1. Update Version

```bash
cd shared/api-client
npm version patch  # or minor, or major
```

### 2. Build

```bash
npm run build
```

### 3. Publish

```bash
npm publish --access public
```

### 4. Install in Projects

```bash
npm install @horizon-hcm/api-client
```

## Local Development

For local development without publishing to NPM:

### Using npm link

```bash
# In SDK directory
cd shared/api-client
npm link

# In frontend directory
cd ../../frontend
npm link @horizon-hcm/api-client
```

### Using file path

```bash
cd frontend
npm install ../shared/api-client
```

## Regenerating After API Changes

Whenever you make changes to the API (add endpoints, modify DTOs, etc.):

1. **Update OpenAPI Decorators**: Ensure all controllers and DTOs have proper Swagger decorators
2. **Start the Server**: `npm run start:dev`
3. **Regenerate SDK**: `npm run generate:sdk`
4. **Update Version**: `cd ../shared/api-client && npm version patch`
5. **Rebuild**: `npm run build`
6. **Update Frontend**: `cd ../../frontend && npm update @horizon-hcm/api-client`

## Troubleshooting

### Server Not Running

**Error**: `API server is not running at http://localhost:3001`

**Solution**: Start the backend server:
```bash
cd backend
npm run start:dev
```

### OpenAPI Generator Not Found

**Error**: `openapi-generator-cli not found`

**Solution**: Install globally:
```bash
npm install -g @openapitools/openapi-generator-cli
```

### Generation Fails

**Error**: SDK generation fails with errors

**Solutions**:
1. Check OpenAPI spec is valid: Visit `http://localhost:3001/api/docs-json`
2. Ensure all DTOs have proper decorators
3. Check for circular dependencies in models
4. Try cleaning and regenerating:
   ```bash
   rm -rf shared/api-client
   npm run generate:sdk
   ```

### Type Errors in Frontend

**Error**: Type mismatches when using SDK

**Solutions**:
1. Regenerate SDK after API changes
2. Clear node_modules and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Restart TypeScript server in IDE

### Import Errors

**Error**: Cannot find module '@horizon-hcm/api-client'

**Solutions**:
1. Ensure SDK is built: `cd shared/api-client && npm run build`
2. Reinstall in frontend: `cd frontend && npm install ../shared/api-client`
3. Check package.json has correct path

## Best Practices

### 1. Version Control

Add to `.gitignore`:
```
shared/api-client/
temp-openapi/
```

Regenerate SDK in CI/CD pipeline instead of committing generated code.

### 2. API Client Wrapper

Create a wrapper for common configuration:

```typescript
// src/lib/api-client.ts
import { Configuration } from '@horizon-hcm/api-client';

export function createApiConfig(): Configuration {
  return new Configuration({
    basePath: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    accessToken: localStorage.getItem('token') || undefined,
  });
}

// Usage
import { ApartmentsApi } from '@horizon-hcm/api-client';
import { createApiConfig } from './lib/api-client';

const apartmentsApi = new ApartmentsApi(createApiConfig());
```

### 3. Error Handling

Create a centralized error handler:

```typescript
// src/lib/api-error-handler.ts
import { AxiosError } from 'axios';

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.status === 401) {
      return 'Unauthorized. Please login again.';
    }
    if (error.response?.status === 403) {
      return 'Permission denied.';
    }
    if (error.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }
  }
  return 'An unexpected error occurred.';
}
```

### 4. Type Guards

Use type guards for runtime type checking:

```typescript
import { ApartmentResponseDto } from '@horizon-hcm/api-client';

function isApartment(obj: unknown): obj is ApartmentResponseDto {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'apartmentNumber' in obj
  );
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Generate SDK

on:
  push:
    branches: [main]
    paths:
      - 'backend/src/**/*.ts'
      - 'backend/src/**/*.dto.ts'

jobs:
  generate-sdk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Start server
        run: |
          cd backend
          npm run start:dev &
          sleep 10
      
      - name: Generate SDK
        run: |
          cd backend
          npm run generate:sdk
      
      - name: Build SDK
        run: |
          cd shared/api-client
          npm install
          npm run build
      
      - name: Publish SDK
        run: |
          cd shared/api-client
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Additional Resources

- [OpenAPI Generator Documentation](https://openapi-generator.tech/docs/generators/typescript-axios)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [NestJS Swagger](https://docs.nestjs.com/openapi/introduction)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the OpenAPI spec at `http://localhost:3001/api/docs`
3. Open an issue on GitHub
4. Contact the development team

