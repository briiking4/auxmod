import React from 'react';

import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';

import { Container, Typography, useMediaQuery, useTheme, Box, Button, Dialog, DialogTitle, DialogContent, IconButton} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import StoreIcon from '@mui/icons-material/Store';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import logo from './auxmod_logo.svg';
import prof_pic from './profile_pic.png';



const LandingMobile = () => {
  const theme = useTheme(); 
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('laptop'));
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
  };

  const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
      padding: theme.spacing(1),
    },
  }));
  
  
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
        <Box sx={{display:'flex', flexDirection:'column'}}>
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
            <Box sx={{pl:4,           
                    display: 'flex', 
                    flexDirection:'row',
                    gap: 2,
                    }}
            >
                <Button 
                    component={Link} 
                    to="/app" 
                    variant="contained" 
                    sx={{ 
                    borderRadius: '50px', 
                    px: 4,
                    py: 1.5,
                    mt:4,
                    fontSize: '1.1rem',
                    backgroundColor: 'secondary.main',
                    }}
                >
                    Try now!
                </Button>

                <Button 
                    variant="outlined" 
                    onClick={handleClickOpen}
                    sx={{ 
                    mt: 4,
                    borderRadius: '50px', 
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    color:'text.primary',
                    borderColor:'secondary.main',
                    borderWidth:'3px'
                    // backgroundColor: 'primary.main',
                    }}
                >
                    Learn More
                </Button>

                <BootstrapDialog
                    onClose={handleClose}
                    aria-labelledby="customized-dialog-title"
                    open={open}
                >
                    <DialogTitle sx={{ m: 0, p: 2, fontWeight:'bold'}} id="customized-dialog-title">
                    About auXmod
                    <Box sx={{display:'flex', flexDirection:'column'}}>
                        <Box sx={{display:'flex', flexDirection:'row'}}>
                        <PersonIcon/>
                        <Typography gutterBottom>
                            Briana King
                        </Typography>
                        </Box>

                        <Box sx={{display:'flex', flexDirection:'row'}}>
                        <EmailIcon/> 
                        <Typography gutterBottom>
                            brianaking626@gmail.com
                        </Typography> 
                        </Box>
                    </Box>
                    </DialogTitle>
                    <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={(theme) => ({
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                    })}
                    >
                    <CloseIcon />
                    </IconButton>
                    <DialogContent dividers>
                    <Typography sx={{fontWeight:'bold'}} gutterBottom>
                        What is it?
                    </Typography>
                    <Typography gutterBottom>
                        AuXmod is an app for playlist moderation, ensuring your playlists are safe for sensitive environments like
                        retail stores, cafés, workplaces, and schools. It helps curate playlists free from explicit content while 
                        preserving the music experience.
                    </Typography>

                    <Typography sx={{fontWeight:'bold'}} gutterBottom>
                        Who is it for?
                    </Typography>
                    <Typography gutterBottom>
                        The app is designed for business owners, educators, parents, and anyone managing public or shared 
                        spaces who want to maintain a family-friendly or professional atmosphere without compromising on music
                        quality.
                    </Typography>

                    <Typography sx={{fontWeight:'bold'}} gutterBottom>
                        What does it do?
                    </Typography>
                    <Typography gutterBottom>
                        Filter out and flag songs in any Spotify playlist containing profanity, violence, and/or sexual themes. If you 
                        select the "Profanity" filter, auXmod will swap out clean or radio versions of songs. Your original playlist 
                        remains untouched—auXmod creates a new, filtered version based on your selected preferences. You may choose 
                        to add back songs that were excluded if you decide they fit the playlist.
                    </Typography>
                    
                    <Typography sx={{fontWeight:'bold'}} gutterBottom>
                        What it does not do:
                    </Typography>
                    <Typography gutterBottom>
                        auXmod does not create clean versions of songs. It moderates existing playlists and filters out unwanted content.
                        It won't alter or censor songs directly but will help you find clean versions when they exist.
                    </Typography>
                    </DialogContent>
                </BootstrapDialog>
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