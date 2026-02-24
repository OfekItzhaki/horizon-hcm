import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Save, Send } from '@mui/icons-material';
import { useFeatureFlagsStore } from '../../hooks/useFeatureFlags';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SystemConfigPage() {
  const [tabValue, setTabValue] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { flags, setFlags } = useFeatureFlagsStore();
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFeatureFlagChange = (flag: keyof typeof flags) => {
    setFlags({ [flag]: !flags[flag] });
  };

  const handleSaveSettings = () => {
    // In production, save to API
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendAnnouncement = () => {
    // In production, send via API
    console.log('Sending platform-wide announcement:', announcement);
    setAnnouncement({ title: '', message: '' });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage system-wide settings, feature flags, and platform announcements
      </Typography>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully
        </Alert>
      )}

      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Feature Flags" />
          <Tab label="System Settings" />
          <Tab label="Platform Announcements" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Feature Flags
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enable or disable features across the entire platform
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Core Features
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enablePolls}
                        onChange={() => handleFeatureFlagChange('enablePolls')}
                      />
                    }
                    label="Polls & Voting"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enableMeetings}
                        onChange={() => handleFeatureFlagChange('enableMeetings')}
                      />
                    }
                    label="Meetings"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enableDocuments}
                        onChange={() => handleFeatureFlagChange('enableDocuments')}
                      />
                    }
                    label="Document Management"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enableMaintenance}
                        onChange={() => handleFeatureFlagChange('enableMaintenance')}
                      />
                    }
                    label="Maintenance Requests"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Communication Features
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enableAnnouncements}
                        onChange={() => handleFeatureFlagChange('enableAnnouncements')}
                      />
                    }
                    label="Announcements"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enableMessages}
                        onChange={() => handleFeatureFlagChange('enableMessages')}
                      />
                    }
                    label="Messaging"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enableNotifications}
                        onChange={() => handleFeatureFlagChange('enableNotifications')}
                      />
                    }
                    label="Notifications"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Financial Features
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enablePayments}
                        onChange={() => handleFeatureFlagChange('enablePayments')}
                      />
                    }
                    label="Online Payments"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enableReports}
                        onChange={() => handleFeatureFlagChange('enableReports')}
                      />
                    }
                    label="Financial Reports"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enableExport}
                        onChange={() => handleFeatureFlagChange('enableExport')}
                      />
                    }
                    label="Data Export"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Advanced Features
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enableBulkOperations}
                        onChange={() => handleFeatureFlagChange('enableBulkOperations')}
                      />
                    }
                    label="Bulk Operations"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flags.enable2FA}
                        onChange={() => handleFeatureFlagChange('enable2FA')}
                      />
                    }
                    label="Two-Factor Authentication"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" startIcon={<Save />} onClick={handleSaveSettings}>
              Save Feature Flags
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure system-wide parameters
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
            <TextField
              label="Session Timeout (minutes)"
              type="number"
              defaultValue={30}
              fullWidth
            />
            <TextField
              label="Max File Upload Size (MB)"
              type="number"
              defaultValue={10}
              fullWidth
            />
            <TextField label="Password Minimum Length" type="number" defaultValue={8} fullWidth />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Require Email Verification"
            />
            <FormControlLabel control={<Switch defaultChecked />} label="Enable Audit Logging" />
            <FormControlLabel control={<Switch />} label="Maintenance Mode" />

            <Button variant="contained" startIcon={<Save />} onClick={handleSaveSettings}>
              Save System Settings
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Platform-Wide Announcements
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Send important announcements to all users across all buildings
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
            <TextField
              label="Announcement Title"
              value={announcement.title}
              onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Announcement Message"
              value={announcement.message}
              onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />

            <Alert severity="warning">
              This announcement will be sent to all users across all buildings. Use with caution.
            </Alert>

            <Button
              variant="contained"
              color="primary"
              startIcon={<Send />}
              onClick={handleSendAnnouncement}
              disabled={!announcement.title || !announcement.message}
            >
              Send Platform Announcement
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}
