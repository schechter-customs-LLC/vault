import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { Vault } from './components/Vault';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4F46E5',
      light: '#818CF8',
      dark: '#3730A3',
    },
    secondary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    background: {
      default: '#111827',
      paper: '#1F2937',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTkyIDU3NiI+PGRlZnM+PHN0eWxlPi5he2ZpbGw6IzBmMDtvcGFjaXR5OjAuMTt9PC9zdHlsZT48L2RlZnM+PHBhdGggY2xhc3M9ImEiIGQ9Ik01OTYsMjg4YTI4OCwyODgsMCwxLDEsMjg4LTI4OEEyODgsMjg4LDAsMCwxLDU5NiwyODhaTTU5NiwzMmEyNTYsMjU2LDAsMSwwLDI1NiwyNTZBMjU2LDI1NiwwLDAsMCw1OTYsMzJaIi8+PC9zdmc+)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url(/schechter-customs-logo.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.1,
            zIndex: 0,
            filter: 'grayscale(1) brightness(1.5)',
            pointerEvents: 'none'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <Vault />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
