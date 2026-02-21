import { CssBaseline, ThemeProvider } from '@mui/material';
import { lightTheme } from './theme';

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <div>
        <h1>Horizon HCM - Web Application</h1>
        <p>Building management system for residential buildings</p>
      </div>
    </ThemeProvider>
  );
}

export default App;
