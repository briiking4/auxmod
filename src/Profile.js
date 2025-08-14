import * as React from 'react';
import { useState, useEffect} from 'react';
import {Box, Container, Typography, Skeleton }from '@mui/material';
import spotifyApi from './spotifyApi';
import defaultProf from './default-prof.svg'
import logo from './auxmod_logo.svg';



export default function Profile({sendUserInfo, guestMode}) {

  const [userProfile, setUserProfile] = useState({
    userId: '',
    profPic: '',
    name: '',
});

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

      sendUserInfo({userId: response.id,
        profPic: profileImage,
        name: response.display_name,});
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if(!guestMode){
      getUserProfile();
    }else{
      setUserProfile(() => ({
        profPic: logo,
        name: 'Guest auXplorer',
      }));
    }
  }, [])

  return (
    <Container 
        sx={{
            p:0,
            display:'flex',
            flexDirection:'row',
            gap:2,
            alignItems:'center',
      }}>
        <Box 
            sx={{
                width:'48px',
                height:'48px',
                borderRadius:"50%",
                overflow:"hidden",
                backgroundColor: 'primary.main',
            }}
        >
          {userProfile.profPic === '' ?
          <Skeleton variant="circular" />
          :
          <img 
          src={userProfile.profPic} 
          alt="Profile" 
          style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover', // Ensures the image fills the Box while maintaining aspect ratio
          }}></img>


          }

        </Box>
        <Typography variant="h6">{userProfile.name}</Typography>
    </Container>
  );
}
