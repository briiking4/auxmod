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
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: '#333', // Use a solid color here
        },
      },
    },
  },
});

export default theme;
