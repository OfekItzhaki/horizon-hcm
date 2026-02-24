# Storybook Setup Guide

Guide for setting up and using Storybook for component documentation in the Horizon HCM web application.

## Installation

```bash
cd packages/web

# Initialize Storybook
npx storybook@latest init

# This will:
# - Install Storybook dependencies
# - Create .storybook configuration folder
# - Add Storybook scripts to package.json
# - Create example stories
```

## Configuration

### .storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    // Merge with Vite config
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
      '@shared': path.resolve(__dirname, '../../shared/src'),
    };
    return config;
  },
};

export default config;
```

### .storybook/preview.ts

```typescript
import type { Preview } from '@storybook/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '../src/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'dark' ? darkTheme : lightTheme;
      
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Story />
            </ThemeProvider>
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: ['light', 'dark'],
        showName: true,
      },
    },
  },
};

export default preview;
```

## Component Stories

### Example: Button Component

**src/components/Button/Button.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['contained', 'outlined', 'text'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'contained',
    color: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'contained',
    color: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: 'Outlined Button',
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    children: 'Text Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const WithIcon: Story = {
  args: {
    startIcon: <AddIcon />,
    children: 'Add Item',
  },
};
```

### Example: DataTable Component

**src/components/DataTable/DataTable.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from './DataTable';

const meta = {
  title: 'Components/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
];

const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Name', width: 200 },
  { field: 'email', headerName: 'Email', width: 250 },
  { field: 'role', headerName: 'Role', width: 120 },
];

export const Default: Story = {
  args: {
    rows: sampleData,
    columns: columns,
  },
};

export const WithPagination: Story = {
  args: {
    rows: sampleData,
    columns: columns,
    pagination: true,
    pageSize: 10,
  },
};

export const WithSorting: Story = {
  args: {
    rows: sampleData,
    columns: columns,
    sortable: true,
  },
};

export const Loading: Story = {
  args: {
    rows: [],
    columns: columns,
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    rows: [],
    columns: columns,
    emptyMessage: 'No data available',
  },
};
```

### Example: FormField Component

**src/components/FormField/FormField.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './FormField';
import { useForm } from 'react-hook-form';

const meta = {
  title: 'Components/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const { register } = useForm();
      return (
        <form style={{ width: '400px' }}>
          <Story />
        </form>
      );
    },
  ],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    label: 'Username',
    name: 'username',
    type: 'text',
    placeholder: 'Enter username',
  },
};

export const Email: Story = {
  args: {
    label: 'Email',
    name: 'email',
    type: 'email',
    placeholder: 'Enter email',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    name: 'password',
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    name: 'email',
    type: 'email',
    error: 'Invalid email format',
  },
};

export const Required: Story = {
  args: {
    label: 'Name',
    name: 'name',
    type: 'text',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Field',
    name: 'disabled',
    type: 'text',
    disabled: true,
    value: 'Cannot edit',
  },
};

export const Multiline: Story = {
  args: {
    label: 'Description',
    name: 'description',
    multiline: true,
    rows: 4,
    placeholder: 'Enter description',
  },
};
```

## Component Documentation

### Using MDX for Documentation

**src/components/Button/Button.mdx**

```mdx
import { Canvas, Meta, Story } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

A customizable button component built on Material-UI.

## Usage

```tsx
import { Button } from '@/components/Button';

function MyComponent() {
  return (
    <Button variant="contained" color="primary" onClick={handleClick}>
      Click Me
    </Button>
  );
}
```

## Variants

The button supports three variants:

<Canvas of={ButtonStories.Primary} />
<Canvas of={ButtonStories.Outlined} />
<Canvas of={ButtonStories.Text} />

## Colors

Available colors: primary, secondary, error, warning, info, success

## Sizes

Available sizes: small, medium, large

## States

<Canvas of={ButtonStories.Disabled} />

## With Icons

<Canvas of={ButtonStories.WithIcon} />

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'contained' \| 'outlined' \| 'text' | 'contained' | Button variant |
| color | string | 'primary' | Button color |
| size | 'small' \| 'medium' \| 'large' | 'medium' | Button size |
| disabled | boolean | false | Disabled state |
| startIcon | ReactNode | - | Icon before text |
| endIcon | ReactNode | - | Icon after text |
| onClick | function | - | Click handler |

## Accessibility

- Uses semantic HTML button element
- Supports keyboard navigation
- Includes proper ARIA attributes
- Maintains focus states
```

## Running Storybook

```bash
# Start Storybook development server
npm run storybook

# Build static Storybook
npm run build-storybook

# Preview built Storybook
npx http-server storybook-static
```

## Components to Document

### Priority Components

1. **Form Components:**
   - FormField
   - SelectField
   - DatePicker
   - FileUpload
   - SearchInput

2. **Data Display:**
   - DataTable
   - Card
   - StatusChip
   - EmptyState
   - ErrorMessage

3. **Navigation:**
   - Sidebar
   - Header
   - Breadcrumbs
   - Tabs

4. **Feedback:**
   - LoadingSpinner
   - ProgressBar
   - Toast/Snackbar
   - ConfirmDialog

5. **Layout:**
   - Container
   - Grid
   - Stack
   - Divider

## Best Practices

### Story Organization

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx
│   │   ├── Button.test.tsx
│   │   └── Button.mdx
│   ├── DataTable/
│   │   ├── DataTable.tsx
│   │   ├── DataTable.stories.tsx
│   │   ├── DataTable.test.tsx
│   │   └── DataTable.mdx
```

### Story Naming

- Use descriptive names: `Primary`, `WithError`, `Loading`
- Group related stories: `Button/Primary`, `Button/Secondary`
- Use consistent naming across components

### Args and Controls

- Provide sensible defaults
- Use appropriate control types
- Document prop types
- Include all important props

### Documentation

- Write clear descriptions
- Include usage examples
- Document all props
- Add accessibility notes
- Include do's and don'ts

## Deployment

### Deploy to Chromatic

```bash
# Install Chromatic
npm install --save-dev chromatic

# Deploy
npx chromatic --project-token=<your-token>
```

### Deploy to Netlify

```bash
# Build Storybook
npm run build-storybook

# Deploy to Netlify
netlify deploy --dir=storybook-static --prod
```

### Deploy to GitHub Pages

```bash
# Build Storybook
npm run build-storybook

# Deploy to gh-pages branch
npx gh-pages -d storybook-static
```

## Integration with CI/CD

Add to `.github/workflows/ci.yml`:

```yaml
- name: Build Storybook
  run: npm run build-storybook

- name: Deploy Storybook
  if: github.ref == 'refs/heads/main'
  run: |
    npm install -g netlify-cli
    netlify deploy --dir=storybook-static --prod
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Troubleshooting

### Common Issues

1. **Module not found errors:**
   - Check alias configuration in `.storybook/main.ts`
   - Ensure paths match Vite config

2. **Theme not applied:**
   - Verify ThemeProvider in `.storybook/preview.ts`
   - Check theme import paths

3. **Stories not loading:**
   - Check stories glob pattern in `.storybook/main.ts`
   - Verify file naming convention

4. **Build failures:**
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Clear Storybook cache: `npm run storybook -- --no-manager-cache`

## Resources

- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Material-UI with Storybook](https://storybook.js.org/recipes/material-ui)
- [Storybook Addons](https://storybook.js.org/addons)
- [Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Component Story Format](https://storybook.js.org/docs/react/api/csf)
