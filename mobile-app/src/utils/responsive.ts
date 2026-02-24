import { Dimensions, Platform, ScaledSize } from 'react-native';
import { useEffect, useState } from 'react';

// Get current screen dimensions
export const getScreenDimensions = (): ScaledSize => {
  return Dimensions.get('window');
};

// Check if device is in landscape mode
export const isLandscape = (): boolean => {
  const { width, height } = getScreenDimensions();
  return width > height;
};

// Check if device is a tablet
export const isTablet = (): boolean => {
  const { width, height } = getScreenDimensions();
  const aspectRatio = width / height;
  
  // Tablets typically have aspect ratios closer to 1 and larger screens
  return Math.min(width, height) >= 600 && (aspectRatio > 0.6 && aspectRatio < 1.7);
};

// Get responsive value based on screen size
export const getResponsiveValue = <T,>(
  phone: T,
  tablet: T,
  landscape?: T
): T => {
  if (landscape && isLandscape()) return landscape;
  return isTablet() ? tablet : phone;
};

// Hook to track screen dimensions and orientation changes
export const useScreenDimensions = () => {
  const [dimensions, setDimensions] = useState(getScreenDimensions());
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    isLandscape() ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...dimensions,
    orientation,
    isLandscape: orientation === 'landscape',
    isTablet: isTablet(),
  };
};

// Responsive spacing
export const spacing = {
  xs: getResponsiveValue(4, 6),
  sm: getResponsiveValue(8, 12),
  md: getResponsiveValue(16, 24),
  lg: getResponsiveValue(24, 32),
  xl: getResponsiveValue(32, 48),
};

// Responsive font sizes
export const fontSize = {
  xs: getResponsiveValue(10, 12),
  sm: getResponsiveValue(12, 14),
  md: getResponsiveValue(14, 16),
  lg: getResponsiveValue(16, 18),
  xl: getResponsiveValue(20, 24),
  xxl: getResponsiveValue(24, 28),
};

// Platform-specific values
export const platformValue = <T,>(ios: T, android: T): T => {
  return Platform.OS === 'ios' ? ios : android;
};
