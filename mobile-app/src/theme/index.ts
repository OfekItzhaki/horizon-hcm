import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976d2',
    secondary: '#dc004e',
    error: '#f44336',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#000000',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90caf9',
    secondary: '#f48fb1',
    error: '#f44336',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
  },
};

export { lightTheme, darkTheme };
