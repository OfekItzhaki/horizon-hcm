import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordResetRequestSchema, type PasswordResetRequestInput } from '@horizon-hcm/shared';
import { authApi } from '@horizon-hcm/shared';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: PasswordResetRequestInput) => {
    try {
      setError(null);
      setIsLoading(true);

      await authApi.requestPasswordReset(data.email);
      setIsSuccess(true);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const message =
        error.response?.data?.message || 'Failed to send reset email. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
            <Box display="flex" justifyContent="center" mb={2}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
            </Box>
            <Typography variant="h5" component="h1" gutterBottom align="center">
              Check Your Email
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" mb={3}>
              We&apos;ve sent a password reset link to <strong>{getValues('email')}</strong>. Please
              check your inbox and follow the instructions.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              If you don&apos;t see the email, check your spam folder or try again.
            </Alert>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => navigate('/login')}
              sx={{ mb: 1 }}
            >
              Back to Login
            </Button>

            <Button variant="text" fullWidth size="large" onClick={() => setIsSuccess(false)}>
              Resend Email
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
            Reset Password
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </Typography>

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

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ mt: 2, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
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
