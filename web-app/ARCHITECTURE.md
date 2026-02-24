# Architecture Documentation

## Overview

Horizon HCM Frontend is a monorepo containing three packages that share code and follow consistent patterns across web and mobile platforms.

## Monorepo Structure

```
horizon-hcm-frontend/
├── packages/
│   ├── web/              # React web application
│   ├── mobile/           # React Native mobile app
│   └── shared/           # Shared code (API, types, utilities)
├── .eslintrc.js          # Shared ESLint config
├── .prettierrc           # Shared Prettier config
├── tsconfig.json         # Root TypeScript config
└── package.json          # Root package with workspaces
```

## Package Architecture

### Shared Package (`@horizon-hcm/shared`)

The shared package contains code used by both web and mobile applications.

#### Structure

```
packages/shared/src/
├── api/                  # API client and endpoints
│   ├── client.ts        # Axios client configuration
│   ├── auth.ts          # Authentication endpoints
│   ├── buildings.ts     # Building endpoints
│   ├── apartments.ts    # Apartment endpoints
│   └── ...              # Other domain endpoints
├── types/               # TypeScript types
│   ├── auth.ts         # Authentication types
│   ├── building.ts     # Building types
│   └── ...             # Other domain types
├── schemas/            # Zod validation schemas
│   ├── auth.ts        # Auth validation
│   └── ...            # Other validations
├── store/             # Zustand stores
│   ├── authStore.ts   # Authentication state
│   └── appStore.ts    # Application state
├── utils/             # Utility functions
│   ├── date.ts       # Date utilities
│   └── ...           # Other utilities
└── index.ts          # Package exports
```

#### Key Responsibilities

- API client configuration and request/response handling
- Type definitions shared across platforms
- Validation schemas using Zod
- Global state management with Zustand
- Utility functions for common operations

### Web Application (`packages/web`)

React web application built with Vite, TypeScript, and Material-UI.

#### Structure

```
packages/web/src/
├── components/          # Reusable components
│   ├── common/         # Common UI components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── pages/              # Page components (routes)
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Dashboard page
│   └── ...            # Other feature pages
├── routes/            # React Router configuration
├── theme/             # Material-UI theme
├── hooks/             # Custom React hooks
├── utils/             # Web-specific utilities
└── main.tsx           # Application entry point
```

#### Key Technologies

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Material-UI v5**: Component library
- **React Router v6**: Client-side routing
- **React Query**: Server state management
- **Zustand**: Client state management
- **React Hook Form**: Form management
- **Zod**: Validation
- **Socket.io-client**: WebSocket communication

### Mobile Application (`packages/mobile`)

React Native mobile app built with Expo, TypeScript, and React Native Paper.

#### Structure

```
packages/mobile/src/
├── components/          # Reusable components
│   ├── FormField.tsx   # Form input component
│   ├── SelectField.tsx # Select input component
│   └── ...             # Other components
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── dashboard/     # Dashboard screen
│   └── ...            # Other feature screens
├── navigation/        # React Navigation configuration
│   ├── RootNavigator.tsx    # Root navigator
│   ├── AuthNavigator.tsx    # Auth stack
│   └── MainNavigator.tsx    # Main tab/stack
├── theme/             # React Native Paper theme
├── hooks/             # Custom React hooks
├── utils/             # Mobile-specific utilities
│   ├── biometric.ts   # Biometric auth
│   ├── camera.ts      # Camera utilities
│   ├── notifications.ts # Push notifications
│   ├── websocket.ts   # WebSocket service
│   ├── responsive.ts  # Responsive utilities
│   └── gestures.ts    # Gesture handlers
└── types/             # Mobile-specific types
```

#### Key Technologies

- **React Native**: Mobile UI framework
- **TypeScript**: Type safety
- **Expo**: Development platform
- **React Native Paper**: Component library
- **React Navigation v6**: Navigation
- **React Query**: Server state management
- **Zustand**: Client state management
- **React Hook Form**: Form management
- **Zod**: Validation
- **Socket.io-client**: WebSocket communication
- **Expo Notifications**: Push notifications
- **Expo Camera**: Camera access
- **Expo LocalAuthentication**: Biometric auth

## State Management

### Client State (Zustand)

Zustand manages client-side state that persists across sessions.

#### Auth Store

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (tokens, user) => void;
  logout: () => void;
  setTokens: (access, refresh) => void;
  updateUser: (user) => void;
}
```

#### App Store

```typescript
interface AppState {
  selectedBuildingId: string | null;
  theme: 'light' | 'dark';
  language: 'en' | 'he';
  setSelectedBuilding: (id) => void;
  setTheme: (theme) => void;
  setLanguage: (lang) => void;
}
```

### Server State (React Query)

React Query manages server state with automatic caching, refetching, and optimistic updates.

#### Query Keys

```typescript
// Buildings
['buildings']
['buildings', buildingId]

// Apartments
['apartments', buildingId]
['apartments', apartmentId]

// Invoices
['invoices', buildingId]
['invoices', invoiceId]

// ... other entities
```

#### Mutations

```typescript
// Create
useMutation({ mutationFn: api.create })

// Update
useMutation({ mutationFn: api.update })

// Delete
useMutation({ mutationFn: api.delete })
```

## API Integration

### API Client Configuration

```typescript
configureAPIClient({
  baseURL: 'http://localhost:3001/api',
  getTokens: () => {
    // Get tokens from auth store
  },
  saveTokens: (tokens) => {
    // Save tokens to auth store
  },
  clearTokens: () => {
    // Clear tokens and logout
  },
  onUnauthorized: () => {
    // Handle 401 errors
  },
});
```

### Request Flow

1. Component calls API function
2. API client adds authentication headers
3. Request sent to backend
4. Response intercepted for token refresh
5. Data returned to component
6. React Query caches the result

### Error Handling

```typescript
// API errors are caught and handled
try {
  const data = await api.getData();
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - handled by interceptor
  } else if (error.response?.status === 403) {
    // Forbidden - show error
  } else {
    // Other errors - show generic error
  }
}
```

## Real-Time Communication

### WebSocket Service

```typescript
class WebSocketService {
  connect(): void;
  disconnect(): void;
  joinBuilding(buildingId: string): void;
  leaveBuilding(buildingId: string): void;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, data: any): void;
}
```

### Event Types

- `notification:new`: New notification received
- `message:new`: New chat message received
- `announcement:new`: New announcement posted
- `invoice:updated`: Invoice status changed
- `maintenance:updated`: Maintenance request updated

### Usage Pattern

```typescript
// Listen for events
useEffect(() => {
  const handleNotification = (data) => {
    queryClient.invalidateQueries(['notifications']);
  };
  
  websocketService.on('notification:new', handleNotification);
  
  return () => {
    websocketService.off('notification:new', handleNotification);
  };
}, []);
```

## Navigation

### Web (React Router)

```
/                       # Landing page
/login                  # Login page
/register               # Registration page
/dashboard              # Dashboard (protected)
/buildings              # Buildings list (protected)
/buildings/:id          # Building detail (protected)
/apartments             # Apartments list (protected)
/invoices               # Invoices list (protected)
...                     # Other routes
```

### Mobile (React Navigation)

```
Root Navigator
├── Auth Stack (Unauthenticated)
│   ├── Login
│   ├── Register
│   └── ForgotPassword
└── Main Navigator (Authenticated)
    ├── Dashboard Tab
    ├── Finance Tab
    │   ├── Invoices
    │   ├── Payments
    │   └── Reports
    ├── Communication Tab
    │   ├── Announcements
    │   ├── Meetings
    │   ├── Polls
    │   └── Notifications
    └── More Tab
        ├── Buildings
        ├── Apartments
        ├── Residents
        ├── Maintenance
        ├── Documents
        ├── Profile
        └── Settings
```

## Component Patterns

### Container/Presentational Pattern

```typescript
// Container (logic)
const BuildingListContainer = () => {
  const { data, isLoading } = useQuery(['buildings'], api.getBuildings);
  
  if (isLoading) return <LoadingSpinner />;
  
  return <BuildingList buildings={data} />;
};

// Presentational (UI)
const BuildingList = ({ buildings }) => {
  return (
    <div>
      {buildings.map(building => (
        <BuildingCard key={building.id} building={building} />
      ))}
    </div>
  );
};
```

### Custom Hooks Pattern

```typescript
// Custom hook for data fetching
const useBuildings = () => {
  return useQuery(['buildings'], api.getBuildings, {
    staleTime: 5 * 60 * 1000,
  });
};

// Usage
const { data: buildings, isLoading } = useBuildings();
```

### Form Pattern

```typescript
// Form with validation
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });
  
  const onSubmit = (data) => {
    // Handle form submission
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

## Security

### Authentication Flow

1. User submits credentials
2. Backend validates and returns JWT tokens
3. Tokens stored in Zustand (persisted to storage)
4. Access token included in API requests
5. Refresh token used to get new access token
6. Logout clears tokens and redirects to login

### Token Management

- Access token: Short-lived (1 hour)
- Refresh token: Long-lived (7 days)
- Automatic refresh before expiration
- Secure storage (localStorage for web, AsyncStorage for mobile)

### Authorization

- Role-based access control (RBAC)
- Roles: admin, committee_member, owner, tenant
- Protected routes check authentication
- API endpoints validate permissions

## Performance Optimization

### Code Splitting (Web)

```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Buildings = lazy(() => import('./pages/Buildings'));
```

### Image Optimization

- WebP format for web
- Compressed images for mobile
- Lazy loading for images
- Responsive images

### Bundle Optimization

- Tree shaking
- Minification
- Code splitting
- Dynamic imports

## Testing Strategy

### Unit Tests

- Utility functions
- Custom hooks
- Validation schemas

### Component Tests

- Render tests
- User interaction tests
- Form validation tests

### Integration Tests

- API integration
- Authentication flow
- Critical user flows

### E2E Tests

- Complete user journeys
- Cross-platform testing
- Real device testing

## Deployment

### Web Deployment

1. Build: `npm run build:web`
2. Deploy to Vercel/Netlify
3. Configure environment variables
4. Set up custom domain

### Mobile Deployment

1. Configure EAS Build
2. Build: `eas build --platform ios/android`
3. Submit: `eas submit --platform ios/android`
4. App Store/Google Play review

## Monitoring

### Error Tracking

- Sentry for error reporting
- Error boundaries for graceful failures
- User context in error reports

### Analytics

- Google Analytics for usage tracking
- Custom events for key actions
- Privacy-compliant tracking

## Best Practices

### Code Style

- Follow HORIZON STANDARD
- Keep files small (<300 lines)
- Keep functions short (<50 lines)
- Avoid code duplication
- Use TypeScript strict mode

### Git Workflow

- Feature branches
- Pull requests with reviews
- Conventional commits
- Semantic versioning

### Documentation

- README for each package
- Inline code comments
- API documentation
- Architecture diagrams
