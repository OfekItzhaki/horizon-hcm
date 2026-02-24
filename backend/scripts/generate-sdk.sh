#!/bin/bash

# API Client SDK Generation Script
# This script generates a TypeScript SDK from the OpenAPI/Swagger specification

set -e

echo "🚀 Generating API Client SDK..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
SWAGGER_JSON_URL="${API_URL}/api/docs-json"
OUTPUT_DIR="shared/api-client"
TEMP_DIR="temp-openapi"

# Check if server is running
echo "📡 Checking if API server is running at ${API_URL}..."
if ! curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: API server is not running at ${API_URL}${NC}"
    echo "Please start the server with: npm run start:dev"
    exit 1
fi

echo -e "${GREEN}✅ API server is running${NC}"

# Create temp directory
mkdir -p "${TEMP_DIR}"

# Download OpenAPI spec
echo "📥 Downloading OpenAPI specification..."
curl -s "${SWAGGER_JSON_URL}" > "${TEMP_DIR}/openapi.json"

if [ ! -s "${TEMP_DIR}/openapi.json" ]; then
    echo -e "${RED}❌ Error: Failed to download OpenAPI spec${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

echo -e "${GREEN}✅ OpenAPI spec downloaded${NC}"

# Check if openapi-generator-cli is installed
if ! command -v openapi-generator-cli &> /dev/null; then
    echo -e "${YELLOW}⚠️  openapi-generator-cli not found. Installing...${NC}"
    npm install -g @openapitools/openapi-generator-cli
fi

# Clean output directory
echo "🧹 Cleaning output directory..."
rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"

# Generate TypeScript SDK
echo "⚙️  Generating TypeScript SDK..."
openapi-generator-cli generate \
    -i "${TEMP_DIR}/openapi.json" \
    -g typescript-axios \
    -o "${OUTPUT_DIR}" \
    --additional-properties=supportsES6=true,npmName=@horizon-hcm/api-client,npmVersion=1.0.0,withSeparateModelsAndApi=true,apiPackage=api,modelPackage=models

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: SDK generation failed${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

echo -e "${GREEN}✅ SDK generated successfully${NC}"

# Copy OpenAPI spec to output directory
cp "${TEMP_DIR}/openapi.json" "${OUTPUT_DIR}/openapi.json"

# Create README
echo "📝 Creating README..."
cat > "${OUTPUT_DIR}/README.md" << 'EOF'
# Horizon-HCM API Client SDK

Type-safe TypeScript client for the Horizon-HCM API.

## Installation

```bash
npm install @horizon-hcm/api-client
# or
yarn add @horizon-hcm/api-client
```

## Usage

### Basic Setup

```typescript
import { Configuration, ApartmentsApi, AuthApi } from '@horizon-hcm/api-client';

// Configure the client
const config = new Configuration({
  basePath: 'http://localhost:3001',
  accessToken: 'your-jwt-token',
});

// Create API instances
const apartmentsApi = new ApartmentsApi(config);
const authApi = new AuthApi(config);
```

### Authentication

```typescript
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
```

### Making Requests

```typescript
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
```

### Error Handling

```typescript
import { AxiosError } from 'axios';

try {
  const apartment = await apartmentsApi.getApartment('invalid-id');
} catch (error) {
  if (error instanceof AxiosError) {
    console.error('API Error:', error.response?.data);
    console.error('Status:', error.response?.status);
  }
}
```

### React Integration

```typescript
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
```

### Custom Axios Instance

```typescript
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
    config.headers.Authorization = `Bearer ${token}`;
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
```

## Available APIs

- `AuthApi` - Authentication endpoints
- `ApartmentsApi` - Apartment management
- `BuildingsApi` - Building management
- `ResidentsApi` - Resident management
- `ReportsApi` - Financial reports
- `PaymentsApi` - Payment processing
- `AnnouncementsApi` - Announcements
- `DocumentsApi` - Document management
- `InvoicesApi` - Invoice management
- `MessagesApi` - Messaging system
- `NotificationsApi` - Notifications
- `PollsApi` - Polls and voting

## Type Safety

All request and response types are fully typed:

```typescript
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
```

## Configuration Options

```typescript
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
```

## Development

### Regenerate SDK

To regenerate the SDK after API changes:

```bash
cd backend
npm run generate:sdk
```

### Update Package

After regenerating, update the package version and publish:

```bash
cd shared/api-client
npm version patch
npm publish
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
EOF

echo -e "${GREEN}✅ README created${NC}"

# Create package.json if it doesn't exist
if [ ! -f "${OUTPUT_DIR}/package.json" ]; then
    echo "📦 Creating package.json..."
    cat > "${OUTPUT_DIR}/package.json" << 'EOF'
{
  "name": "@horizon-hcm/api-client",
  "version": "1.0.0",
  "description": "Type-safe TypeScript client for Horizon-HCM API",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "horizon-hcm",
    "api-client",
    "typescript",
    "axios"
  ],
  "author": "Horizon-HCM Team",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  },
  "peerDependencies": {
    "axios": "^1.6.0"
  }
}
EOF
    echo -e "${GREEN}✅ package.json created${NC}"
fi

# Clean up temp directory
rm -rf "${TEMP_DIR}"

echo ""
echo -e "${GREEN}✨ SDK generation complete!${NC}"
echo ""
echo "📁 Output directory: ${OUTPUT_DIR}"
echo ""
echo "Next steps:"
echo "  1. cd ${OUTPUT_DIR}"
echo "  2. npm install"
echo "  3. npm run build"
echo "  4. npm publish (to publish to npm registry)"
echo ""
echo "Or use locally:"
echo "  cd frontend"
echo "  npm install ../shared/api-client"
echo ""
