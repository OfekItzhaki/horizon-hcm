import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface TourStep {
  title: string;
  description: string;
  target?: string;
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to Horizon HCM',
    description:
      'Let us show you around! This quick tour will help you get started with the key features.',
  },
  {
    title: 'Building Selector',
    description:
      'Use the building selector in the header to switch between different buildings you manage.',
    target: 'building-selector',
  },
  {
    title: 'Navigation Menu',
    description:
      'Access all features from the sidebar menu. Click the menu icon to collapse or expand it.',
    target: 'sidebar',
  },
  {
    title: 'Notifications',
    description:
      'Stay updated with real-time notifications. Click the bell icon to view all notifications.',
    target: 'notifications',
  },
  {
    title: 'Quick Actions',
    description:
      'Use keyboard shortcuts for faster navigation. Press Ctrl+/ to see all available shortcuts.',
  },
  {
    title: 'Get Started',
    description:
      "You're all set! Explore the dashboard and start managing your building community.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      // Show tour after a short delay
      setTimeout(() => setOpen(true), 1000);
    }
  }, []);

  const handleNext = () => {
    if (activeStep === tourSteps.length - 1) {
      handleClose();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem('hasSeenTour', 'true');
  };

  const currentStep = tourSteps[activeStep];

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{currentStep.title}</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {tourSteps.map((_, index) => (
            <Step key={index}>
              <StepLabel />
            </Step>
          ))}
        </Stepper>
        <Typography variant="body1" paragraph>
          {currentStep.description}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Step {activeStep + 1} of {tourSteps.length}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSkip}>Skip Tour</Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
        <Button onClick={handleNext} variant="contained">
          {activeStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
