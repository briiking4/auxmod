import React from 'react';

import { Link } from 'react-router-dom';
import { Container, Typography, useMediaQuery, useTheme, Box, Button} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import StoreIcon from '@mui/icons-material/Store';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import logo from './auxmod_logo.svg';
import prof_pic from './profile_pic.png';



const LandingMobile = () => {
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
        {/* title, contact, try now etc. */}
        <Box sx={{display:'flex', flexDirection:'column', gap:2}}>
            <Box sx={{display:'flex', flexDirection:'row', gap:1}}>
                <Box sx={{display:'flex', flexDirection:'column'}}>
                    <img src={logo} width="100%"/>     
                </Box>
                <Box sx={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
                    <Typography variant='h3' sx={{fontWeight:'bold'}}> auXmod </Typography>
                    <Typography variant='h5'> Your aux, your rules </Typography>
                </Box>
            </Box>
            <Box sx={{display:'flex', flexDirection:'row', gap:1, pl:5 }}>
                <Box sx={{display:'flex', flexDirection:'column'}}>
                    <Box sx={{display:'flex', flexDirection:'row', alignItems:'center', gap:1}}>
                        <Box sx={{backgroundColor: 'white', width:'60px', height:'60px', borderRadius:'50%', overflow:'hidden'}}>
                            <img src={prof_pic} width="100%" style={{objectFit:'cover'}}/>
                        </Box>
                        <Box sx={{display:'flex', flexDirection:'column'}}> 
                            <Typography variant='h5'> Briana King </Typography>
                            <Typography variant='h7'> brianaking626@gmail.com </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
            <Box sx={{pl:4, display:'flex', justifyContent:'flex-start'}}>
                <Button 
                    component={Link} 
                    to="/app" 
                    variant="contained" 
                    sx={{ 
                    borderRadius: '50px', 
                    px: 4,
                    fontSize: '1.1rem',
                    backgroundColor: 'secondary.main',
                    }}
                >
                    Try now!
                </Button>
            </Box>
        </Box>

        {/* "Playlist" items */}


        <Box sx={{display:'flex', flexDirection:'column', gap:8, mt:5, pl:2}}>

            <Box sx={{display:'flex', flexDirection:'row', gap:2, alignItems:'center'}}>
                <Typography variant='h6'> 1 </Typography>

                <Box sx={{backgroundColor:'primary.main', borderRadius:'10px' , width:'100px', height:'100px', display:'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <FilterAltIcon sx={{fontSize:'5rem', color:'white'}}/>
                </Box>
                <Box sx={{display:'flex', flexDirection:'column'}}>
                    <Typography variant='h6'> Filter Explicit Content in Playlists </Typography>
                    <Typography variant='caption'> Flag songs with profanity, violence, or sexual themes</Typography>
                </Box>


            </Box>

            <Box sx={{display:'flex', flexDirection:'row', gap:2,  alignItems:'center'}}>
                <Typography variant='h6'> 2 </Typography>

                <Box sx={{backgroundColor:'primary.main',borderRadius:'10px' , width:'100px', height:'100px', display:'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <StoreIcon sx={{fontSize:'5rem', color:'white'}}/>

                </Box>
                <Box sx={{display:'flex', flexDirection:'column'}}>
                    <Typography variant='h6'> Businesses, Schools & Families </Typography>
                    <Typography variant='caption'> Keep your music safe for work, school, or family time</Typography>
                </Box>

            </Box>

            <Box sx={{display:'flex', flexDirection:'row', gap:2,  alignItems:'center'}}>
                <Typography variant='h6'> 3 </Typography>

                <Box sx={{backgroundColor:'primary.main', borderRadius:'10px' , width:'100px', height:'100px', display:'flex', justifyContent: 'center', alignItems: 'center'}}>
                     <ContentCopyIcon sx={{fontSize:'5rem', color:'white'}}/>
                </Box>
                <Box sx={{display:'flex', flexDirection:'column'}}>
                    <Typography variant='h6'> Original playlist stays untouched </Typography>
                    <Typography variant='caption'> A filtered copy is created — your original stays intact </Typography>
                </Box>

            </Box>

        </Box>
    </Container>
  );
};

export default LandingMobile;