import * as React from 'react';
import { useState, useEffect } from 'react';
import { Box, Container, Typography, Skeleton, Menu, MenuItem } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import spotifyApi from './spotifyApi';
import defaultProf from './default-prof.svg';
import logo from './auxmod_logo.svg';
import { useNavigate } from 'react-router-dom'; 

export default function Profile({ sendLoginStatus, sendUserInfo, guestMode }) {
  const [userProfile, setUserProfile] = useState({
    userId: '',
    profPic: '',
    name: '',
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    handleClose();
    sendLoginStatus(false);
    spotifyApi.setAccessToken(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  const getUserProfile = async () => {
    try {
      const response = await spotifyApi.getMe();

      const profileImage =
        response.images && response.images.length > 0
          ? response.images[0].url
          : defaultProf;

      setUserProfile(() => ({
        userId: response.id,
        profPic: profileImage,
        name: response.display_name,
      }));

      sendUserInfo({
        userId: response.id,
        profPic: profileImage,
        name: response.display_name,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (!guestMode) {
      getUserProfile();
    } else {
      setUserProfile(() => ({
        profPic: logo,
        name: 'Guest auXplorer',
      }));
    }
  }, []);

  return (
    <>
      <Container
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: 2,
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={handleClick}
      >
        <Box
          sx={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: 'primary.main',
          }}
        >
          {userProfile.profPic === '' ? (
            <Skeleton variant="circular" width={48} height={48} />
          ) : (
            <img
              src={userProfile.profPic}
              alt="Profile"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
        </Box>
        <Typography variant="h6">{userProfile.name}</Typography>
      </Container>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: { mt: 1.5, borderRadius: '12px', minWidth: 160 },
        }}
      >
        <MenuItem onClick={handleLogout} 
        disableRipple
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)', // keep a subtle hover
          },
          '&.Mui-focusVisible': {
            backgroundColor: 'transparent',
          },
          '&.Mui-selected': {
            backgroundColor: 'transparent',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)',
          },
        }}
        >
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}
