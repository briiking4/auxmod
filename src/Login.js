import * as React from 'react';
import { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, keyframes, TextField } from '@mui/material';
// import logo from './logo.png';
import logo from './auxmod_logo.svg';
import spotifyLogo from './spotify-logo.png'
import spotifyApi, {initGuestAccess} from './spotifyApi';

export default function Login({ sendLoginStatus, sendAccessToken, sendGuestModeStatus }) {
  const [state, setState] = useState({
    loggedIn: false,
    token: '',
    refreshToken: '',
    expiresAt: null,
    guestMode: false,
  });
  
  // Add state to control when content is visible
  const [contentLoaded, setContentLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getHashParams = () => {
    const hashParams = {};
    const r = /([^&;=]+)=?([^&;]*)/g;
    const q = window.location.hash.substring(1);
    let e;
    while ((e = r.exec(q))) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  };

  // Refresh the access token using the refresh token
  const refreshAccessToken = async (refreshToken) => {
    try {
      console.log('Refreshing access token...');
      console.log('refresh token is', refreshToken);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();
      console.log('Refresh response data:', data);

      if (data.access_token) {
        const expiresAt = Date.now() + data.expires_in * 1000;
        spotifyApi.setAccessToken(data.access_token);

        setState((prevState) => ({
          ...prevState,
          token: data.access_token,
          expiresAt,
        }));

        scheduleTokenRefresh(expiresAt, refreshToken);
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
    }
  };

  // Schedule the next token refresh
  const scheduleTokenRefresh = (expiresAt, refreshToken) => {
    if (!expiresAt) return;

    const timeout = expiresAt - Date.now() - 60000; 

    if (timeout <= 0) {
      console.log('Token already expired or near expiration, refreshing immediately...');
      refreshAccessToken(refreshToken);
    } else {
      console.log('Scheduling refresh...');
      setTimeout(() => refreshAccessToken(refreshToken), timeout); 
    }
  };

  // Preload the image
  useEffect(() => {
    const img = new Image();
    img.src = logo;
    img.onload = () => {
      setImageLoaded(true);
    };
  }, []);

  // Handle login and token processing
  useEffect(() => {
    const params = getHashParams();
    const token = params.access_token;
    const refreshToken = params.refresh_token;
    const expiresIn = parseInt(params.expires_in, 10);

    if (token) {
      const calculatedExpiresAt = Date.now() + expiresIn * 1000;

      spotifyApi.setAccessToken(token);
      setState((prevState) => ({
        ...prevState,
        loggedIn: true,
        token,
        refreshToken,
        expiresAt: calculatedExpiresAt,
      }));

      console.log("Expires at", calculatedExpiresAt);
      scheduleTokenRefresh(calculatedExpiresAt, refreshToken);
    }
  }, []);
  
  // Set content as loaded only after image is loaded
  useEffect(() => {
    if (imageLoaded) {
      // Increased delay to ensure everything is ready
      setTimeout(() => setContentLoaded(true), 300);
    }
  }, [imageLoaded]);

  // Update access token in parent component when it changes
  useEffect(() => {
    if (state.token) {
      console.log("TOKEN CHANGE")
      sendAccessToken(state.token);
    }
  }, [state.token, sendAccessToken]);

// Update login status in parent component when loggedIn changes
  useEffect(() => {
    sendLoginStatus(state.loggedIn); 
  }, [state.loggedIn, sendLoginStatus]);


  // Update login status in parent component when userMode changes

  useEffect(() => {
    if (state.guestMode) {
      sendGuestModeStatus(true );
    }
  }, [state.guestMode, sendGuestModeStatus]);


  const handleGuestLogin= async () => {  
    // Get guest token from backend
    const guestToken = await initGuestAccess();
    console.log(guestToken)
  
    // Set guest mode + store token in state
    setState((prevState) => ({
      ...prevState,
      guestMode: true,
      token: guestToken
    }));
  };
  
  // Define animations
  const spinIn = keyframes`
    from {
      opacity: 0;
      transform: rotate(-720deg) scale(0.5);
    }
    to {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }
  `;

  const fadeIn = keyframes`
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  return (
    <Container
      id="login"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '90vh',
        objectFit: 'contain',
      }}
    >
      {contentLoaded && (
        <>
          <Box sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Box
              sx={{
                animation: `${spinIn} 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                opacity: 0,
                animationFillMode: 'forwards',
                mb: 1
              }}
            >
              <img
                src={logo}
                alt="logo"
                style={{ 
                  width: '100%', 
                  marginBottom: '1rem',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
              sx={{
                opacity: 0,
                animation: `${fadeIn} 1s ease-out 1s`,
                animationFillMode: 'forwards'
              }}
            >
              auXmod
            </Typography>
          </Box>
          <Container
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 5,
              my: 4,
              '& .MuiButtonBase-root': {
                borderRadius: '50px',
              },
              p: 0,
              opacity: 0,
              animation: `${fadeIn} 1s ease-out 2s`,  // Button appears last
              animationFillMode: 'forwards'
            }}
          >
            {/* <Typography>AuXmod is currently under maintenance. Please check back on 7/20/25!</Typography> */}
            <Box sx={{display: 'flex', flexDirection:'column'}}>
              <Button 
                variant="contained" 
                sx={{ width: '230px', minHeight: '42px', backgroundColor: '#1ED760'}}
                href={`${process.env.REACT_APP_BACKEND_URL}/login`}  
                startIcon={
                  <img 
                    src={spotifyLogo} 
                    alt="Spotify logo"
                    style={{ width: 24, height: 24,}}
                  />
                }  
              >
                Login with Spotify
              </Button>
            </Box>

            <Box
              sx={{ width: '200px', minHeight: '42px'}}
              onClick={handleGuestLogin}
            >
              <Button type="submit">Try as a Guest</Button>
            </Box>

          </Container>
        </>
      )}
    </Container>
  );
}