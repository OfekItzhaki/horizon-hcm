# @horizon-hcm/shared

Shared code package for Horizon HCM frontend applications (web and mobile).

## Contents

- **API Client**: Axios-based HTTP client with authentication and error handling
- **TypeScript Types**: Shared interfaces and types for all entities
- **Validation Schemas**: Zod schemas for form validation
- **Zustand Stores**: Shared state management
- **Utilities**: Common utility functions (date formatting, validation, etc.)
- **Constants**: Application constants and configuration

## Usage

```typescript
import { apiClient, authApi, buildingsApi } from '@horizon-hcm/shared';
import type { User, Building, Invoice } from '@horizon-hcm/shared';
import { loginSchema, invoiceSchema } from '@horizon-hcm/shared';
import { useAuthStore } from '@horizon-hcm/shared';
```

## Development

```bash
# Build package
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Run property-based tests
npm test -- --testPathPattern=test

# Watch mode
npm run test:watch

# Type check
npm run type-check
```

## Structure

```
src/
├── api/              # API client and service modules
├── types/            # TypeScript interfaces
├── schemas/          # Zod validation schemas
├── store/            # Zustand stores
├── utils/            # Utility functions
├── constants/        # Application constants
└── index.ts          # Package exports
```

## Features

- ✅ Type-safe API client
- ✅ Automatic token refresh
- ✅ Request/response interceptors
- ✅ Zod schema validation
- ✅ Shared state management
- ✅ Utility functions (date, currency, validation)
- ✅ Property-based tests

## License

UNLICENSED - Private project
