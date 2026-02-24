import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { usersApi } from '@horizon-hcm/shared/src/api/users';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const { language, setLanguage, theme, setTheme } = useAppStore();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>();

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<ProfileFormData>) => usersApi.updateProfile(data),
    onSuccess: () => {
      setProfileSuccess(true);
      setProfileError(null);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(data),
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError(null);
      resetPassword();
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    },
  });

  const onSubmitProfile = (data: ProfileFormData) => {
    setProfileError(null);
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError(null);
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        Settings
      </Typography>

      {/* Profile Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Profile Information
        </Typography>

        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar sx={{ width: 80, height: 80 }}>{user?.name?.charAt(0) || 'U'}</Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Role: {user?.role}
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
          <Box display="flex" flexDirection="column" gap={2}>
            {profileSuccess && <Alert severity="success">Profile updated successfully!</Alert>}
            {profileError && <Alert severity="error">{profileError}</Alert>}

            <TextField
              label="Name"
              {...registerProfile('name', { required: 'Name is required' })}
              error={!!profileErrors.name}
              helperText={profileErrors.name?.message}
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              {...registerProfile('email', { required: 'Email is required' })}
              error={!!profileErrors.email}
              helperText={profileErrors.email?.message}
              fullWidth
            />

            <TextField
              label="Phone"
              {...registerProfile('phone')}
              error={!!profileErrors.phone}
              helperText={profileErrors.phone?.message}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              disabled={updateProfileMutation.isPending}
              startIcon={updateProfileMutation.isPending && <CircularProgress size={20} />}
            >
              Update Profile
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Password Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Change Password
        </Typography>

        <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
          <Box display="flex" flexDirection="column" gap={2}>
            {passwordSuccess && <Alert severity="success">Password changed successfully!</Alert>}
            {passwordError && <Alert severity="error">{passwordError}</Alert>}

            <TextField
              label="Current Password"
              type="password"
              {...registerPassword('currentPassword', { required: 'Current password is required' })}
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword?.message}
              fullWidth
            />

            <TextField
              label="New Password"
              type="password"
              {...registerPassword('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword?.message}
              fullWidth
            />

            <TextField
              label="Confirm New Password"
              type="password"
              {...registerPassword('confirmPassword', { required: 'Please confirm password' })}
              error={!!passwordErrors.confirmPassword}
              helperText={passwordErrors.confirmPassword?.message}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              disabled={changePasswordMutation.isPending}
              startIcon={changePasswordMutation.isPending && <CircularProgress size={20} />}
            >
              Change Password
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Preferences Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          Preferences
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={theme === 'dark'}
                onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
              />
            }
            label="Dark Mode"
          />

          <Divider />

          <Box>
            <Typography variant="subtitle2" mb={1}>
              Language
            </Typography>
            <TextField
              select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'he')}
              size="small"
              sx={{ minWidth: 200 }}
              SelectProps={{ native: true }}
            >
              <option value="en">English</option>
              <option value="he">עברית (Hebrew)</option>
            </TextField>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
