import { createTheme } from '@mui/material/styles';

// A custom theme for this app
const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#5DAEBE', // Confirm and apply buttons
    },
    secondary: {
      main: '#FFD8A8',
      light: '#FFE8D4' // Filter and step toggle buttons
    },
    background: {
      default: 'linear-gradient(180deg, #87CEEB, #FFD8A8)', // Background gradient
    },
    text: {
      primary: '#353535', // Headers
      secondary: '#555555', // Body text
    },
    action: {
      // disabled: '#B0D6DF', // Disabled button color (lighter than primary)
      // disabledBackground: '#FFE8D4', // Filter/step toggle disabled
    },
  },
  breakpoints: {
    values: {
      mobile: 0,
      tablet: 640,
      laptop: 1024,
      desktop: 1200,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(180deg, #87CEEB, #FFD8A8)',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
        },
      },
    },
  },
});

export default theme;
