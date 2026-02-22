import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { twoFactorVerifySchema, type TwoFactorVerifyInput } from '@horizon-hcm/shared';
import { authApi } from '@horizon-hcm/shared';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isFetchingSetup, setIsFetchingSetup] = useState(true);

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

  // Fetch 2FA setup data on mount
  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        setIsFetchingSetup(true);
        const response = await authApi.setup2FA();
        setQrCode(response.data.qrCode);
        setManualCode(response.data.manualCode);
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to load 2FA setup. Please try again.';
        setError(message);
      } finally {
        setIsFetchingSetup(false);
      }
    };

    fetchSetupData();
  }, []);

  const onSubmit = async (data: TwoFactorVerifyInput) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.verify2FA(data.code);

      // Backend should return backup codes after successful verification
      if (response.data?.backupCodes) {
        setBackupCodes(response.data.backupCodes);
      }

      setIsSetupComplete(true);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid verification code. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard', {
      state: { message: 'Two-factor authentication has been enabled successfully!' },
    });
  };

  if (isFetchingSetup) {
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
          Loading 2FA setup...
        </Typography>
      </Box>
    );
  }

  if (isSetupComplete) {
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
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" justifyContent="center" mb={2}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
            </Box>
            <Typography variant="h5" component="h1" gutterBottom align="center">
              2FA Setup Complete!
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" mb={3}>
              Your account is now protected with two-factor authentication.
            </Typography>

            {backupCodes.length > 0 && (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Save these backup codes in a safe place. You can use them to access your account
                  if you lose your authenticator device.
                </Alert>

                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Backup Codes
                  </Typography>
                  <List dense>
                    {backupCodes.map((code, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Typography variant="body2" color="text.secondary">
                            {index + 1}.
                          </Typography>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontFamily="monospace">
                              {code}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </>
            )}

            <Button variant="contained" fullWidth size="large" onClick={handleComplete}>
              Continue to Dashboard
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
      py={4}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Set Up Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            Scan the QR code with your authenticator app
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* QR Code */}
          {qrCode && (
            <Box display="flex" justifyContent="center" mb={3}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  style={{ display: 'block', maxWidth: '100%' }}
                />
              </Paper>
            </Box>
          )}

          {/* Manual Entry Code */}
          {manualCode && (
            <>
              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  OR ENTER MANUALLY
                </Typography>
              </Divider>

              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Manual Entry Code
                </Typography>
                <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {manualCode}
                </Typography>
              </Paper>
            </>
          )}

          {/* Verification Form */}
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter the 6-digit code from your authenticator app to verify the setup:
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Verification Code"
                  fullWidth
                  margin="normal"
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  disabled={isLoading}
                  autoComplete="off"
                  autoFocus
                  inputProps={{
                    maxLength: 6,
                    pattern: '[0-9]*',
                    inputMode: 'numeric',
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
              sx={{ mt: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Verify and Enable 2FA'}
            </Button>

            <Button
              variant="text"
              fullWidth
              size="large"
              onClick={() => navigate('/dashboard')}
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              Skip for Now
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
