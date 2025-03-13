import React from 'react';

import { Container, useMediaQuery, useTheme} from '@mui/material';
import LandingDesktop from './LandingDesktop';
import LandingMobile from './LandingMobile'

const LandingPage = () => {
  const theme = useTheme(); 
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('laptop'));
  
  
  return (
    <Container 
      sx={{
        maxWidth: '100%',
        height: '100dvh',
        overflow: 'hidden',
        p:0
      }}
    >
      {
        isLargeScreen ?
          <LandingDesktop/>

        :
        <LandingMobile/>

      }
    </Container>
  );
};

export default LandingPage;