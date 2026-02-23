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
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@horizon-hcm/shared';
import { authApi } from '@horizon-hcm/shared';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      acceptedTerms: false,
    },
  });

  console.log('Form errors:', errors);
  console.log('Form values:', getValues());

  const onSubmit = async (data: RegisterInput) => {
    console.log('Form submitted with data:', data);
    try {
      setError(null);
      setIsLoading(true);

      console.log('Calling authApi.register...');
      const response = await authApi.register(data);
      console.log('Registration response:', response);

      // Redirect to login page with success message
      navigate('/login', {
        state: { message: 'Registration successful! Please log in.' },
      });
    } catch (err) {
      console.error('Registration error:', err);
      const error = err as Error & { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
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
      py={4}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom align="center" mb={3}>
            Join Horizon HCM
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full Name"
                  fullWidth
                  margin="normal"
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                  disabled={isLoading}
                  autoComplete="name"
                  autoFocus
                />
              )}
            />

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
                />
              )}
            />

            {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
            <Controller
              name="phone"
              control={control}
              render={({ field }) => {
                console.log('Phone field value:', field.value, 'Type:', typeof field.value);
                return (
                  <TextField
                    {...field}
                    label="Phone Number"
                    type="tel"
                    fullWidth
                    margin="normal"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                );
              }}
            />

            {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              )}
            />

            {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
            <Controller
              name="acceptedTerms"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      disabled={isLoading}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I accept the{' '}
                      <Link href="/terms" target="_blank" underline="hover">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" target="_blank" underline="hover">
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                  sx={{ mt: 1 }}
                />
              )}
            />
            {errors.acceptedTerms && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                {errors.acceptedTerms.message}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
              onClick={() => {
                console.log('Button clicked, form values:', getValues());
                console.log('Form errors before submit:', errors);
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>

            <Box display="flex" justifyContent="center" alignItems="center">
              <Typography variant="body2" color="text.secondary" mr={1}>
                Already have an account?
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
