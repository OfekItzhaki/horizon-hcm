import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@horizon-hcm/shared';
import { authApi } from '@horizon-hcm/shared';
import { useAuthStore } from '../../store';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get success message from navigation state
  const successMessage = (location.state as { message?: string })?.message || null;

  // Clear the navigation state after reading it (only once on mount)
  useEffect(() => {
    if (location.state && (location.state as { message?: string })?.message) {
      // Use setTimeout to avoid navigation during render
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError(null);
      setIsLoading(true);

      // Login and get tokens
      const loginResponse = await authApi.login(data);
      const { accessToken, refreshToken } = loginResponse.data;

      // Store tokens in zustand store
      const setTokens = useAuthStore.getState().setTokens;
      setTokens(accessToken, refreshToken);

      // Small delay to ensure tokens are persisted
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch user profile (now with token set)
      const userResponse = await authApi.getCurrentUser();
      const user = userResponse.data;

      // Update with real user data and tokens
      login(user, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err) {
      const error = err as Error & { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      px={2}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Horizon HCM
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom align="center" mb={3}>
            Building Management System
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              )}
            />

            {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isLoading}
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ mt: 2, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover">
                Forgot password?
              </Link>
              <Link component={RouterLink} to="/register" variant="body2" underline="hover">
                Create account
              </Link>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
