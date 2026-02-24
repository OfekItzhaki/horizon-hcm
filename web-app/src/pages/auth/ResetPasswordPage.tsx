import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
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
  LinearProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordResetSchema, type PasswordResetInput } from '@horizon-hcm/shared';
import { authApi } from '@horizon-hcm/shared';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      token: token || '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid or missing reset token.');
        setIsValidatingToken(false);
        return;
      }

      try {
        setIsValidatingToken(true);
        // You could add a token validation endpoint here
        // For now, we'll assume the token is valid and let the backend validate on submit
        setIsTokenValid(true);
      } catch (err: any) {
        setError('Invalid or expired reset token.');
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: PasswordResetInput) => {
    try {
      setError(null);
      setIsLoading(true);

      await authApi.resetPassword(data.token, data.password);

      // Redirect to login with success message
      navigate('/login', {
        state: { message: 'Password reset successful! Please log in with your new password.' },
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate password strength
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (/[a-z]/.test(pwd)) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password || '');
  const getStrengthColor = () => {
    if (passwordStrength < 50) return 'error';
    if (passwordStrength < 75) return 'warning';
    return 'success';
  };
  const getStrengthLabel = () => {
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Medium';
    return 'Strong';
  };

  if (isValidatingToken) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Validating reset token...
        </Typography>
      </Box>
    );
  }

  if (!isTokenValid) {
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
            <Typography variant="h5" component="h1" gutterBottom align="center">
              Invalid Reset Link
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" mb={3}>
              {error || 'This password reset link is invalid or has expired.'}
            </Typography>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => navigate('/forgot-password')}
              sx={{ mb: 1 }}
            >
              Request New Link
            </Button>

            <Button variant="text" fullWidth size="large" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

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
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Create New Password
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            Enter a strong password for your account.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="New Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isLoading}
                  autoComplete="new-password"
                  autoFocus
                />
              )}
            />

            {/* Password Strength Indicator */}
            {password && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Password Strength
                  </Typography>
                  <Typography variant="caption" color={`${getStrengthColor()}.main`}>
                    {getStrengthLabel()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  color={getStrengthColor()}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            )}

            {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  disabled={isLoading}
                  autoComplete="new-password"
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
              {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>

            <Box display="flex" justifyContent="center" alignItems="center">
              <Typography variant="body2" color="text.secondary" mr={1}>
                Remember your password?
              </Typography>
              <Link component={RouterLink} to="/login" variant="body2" underline="hover">
                Sign in
              </Link>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
