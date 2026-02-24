import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { twoFactorVerifySchema, type TwoFactorVerifyInput } from '@horizon-hcm/shared';
import { authApi } from '@horizon-hcm/shared';
import { useAuthStore } from '../../store';

export default function TwoFactorVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBackupCodeInput, setShowBackupCodeInput] = useState(false);

  // Get temporary auth data from navigation state (passed from login page)
  const tempAuthData = (location.state as any)?.tempAuthData;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorVerifyInput>({
    resolver: zodResolver(twoFactorVerifySchema),
    defaultValues: {
      code: '',
    },
  });

  // Redirect to login if no temp auth data
  if (!tempAuthData) {
    navigate('/login', { replace: true });
    return null;
  }

  const onSubmit = async (data: TwoFactorVerifyInput) => {
    try {
      setError(null);
      setIsLoading(true);

      // Verify 2FA code
      await authApi.verify2FA(data.code);

      // If verification succeeds, complete login with stored credentials
      const { accessToken, refreshToken, user } = tempAuthData;
      login(user, accessToken, refreshToken);

      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid verification code. Please try again.';
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
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            {showBackupCodeInput
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={showBackupCodeInput ? 'Backup Code' : 'Verification Code'}
                  fullWidth
                  margin="normal"
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  disabled={isLoading}
                  autoComplete="off"
                  autoFocus
                  inputProps={{
                    maxLength: showBackupCodeInput ? 12 : 6,
                    pattern: showBackupCodeInput ? '[A-Za-z0-9]*' : '[0-9]*',
                    inputMode: showBackupCodeInput ? 'text' : 'numeric',
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
              {isLoading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>

            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              {!showBackupCodeInput ? (
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  underline="hover"
                  onClick={() => setShowBackupCodeInput(true)}
                  disabled={isLoading}
                >
                  Use backup code instead
                </Link>
              ) : (
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  underline="hover"
                  onClick={() => setShowBackupCodeInput(false)}
                  disabled={isLoading}
                >
                  Use authenticator code
                </Link>
              )}

              <Link
                component="button"
                type="button"
                variant="body2"
                underline="hover"
                onClick={() => navigate('/login')}
                disabled={isLoading}
              >
                Back to login
              </Link>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
