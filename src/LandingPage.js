import React from 'react';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Container, Typography, Button, Box, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import logo from './auxmod_logo.svg';
import display_1 from './display_1.svg';
import display_2 from './display_2.svg';
import cloud from './cloud.svg';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';


const LandingPage = () => {
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
        maxWidth: {
          xs: '100%',
          sm: '100%',
          md: '100%',
          lg: '100%',
        },
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(90deg, #87ceeb, #FFD8A8)',
        position: 'relative',
        overflow: 'hidden', 
        ...(isLargeScreen && {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr', 
        }),
      }}
    >
      {/* Logo */}
      <Box 
        sx={{
          float: 'left', 
          maxWidth: '120px', 
          display: 'flex', 
          flexDirection: 'column', 
          textAlign: 'center',
          ...(isLargeScreen && {
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 5,
          }),
        }}
      >
        <img width="100%" src={logo} alt="auXmod logo" />
        <Typography variant='h6' color='black' sx={{fontSize:'1.7rem'}}>
          auXmod
        </Typography>
      </Box>


      {/* Main content - on left side for large screens */}
      <Box 
        sx={{
          mt: 10, 
          mb: 1, 
          textAlign: 'center',
          position: 'relative', 
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          ...(isLargeScreen && {
            gridColumn: '1',
            pl: 4,
          }),
        }}
      >
        <Typography variant='h3' sx={{fontWeight:'500'}} color='black'>
          Your aux, Your rules
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant='h6' sx={{fontWeight:'350'}}>
            Flag and filter out explicit content— 
          </Typography>
          <Typography variant='h6'  sx={{fontWeight:'350'}}>
            Ensure playlists are safe for any space
          </Typography>
        </Box>
        
        <Box sx={{display:'flex', flexDirection:'row', justifyContent:'center', gap:2 }}>
            <Button 
            component={Link} 
            to="/app" 
            variant="contained" 
            sx={{ 
                mt: 4,
                borderRadius: '50px', 
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                backgroundColor: 'secondary.main',
                alignSelf: 'center'
            }}
            >
            Try now!
            </Button>

            <Button 
            variant="contained" 
            onClick={handleClickOpen}
            sx={{ 
                mt: 4,
                borderRadius: '50px', 
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                backgroundColor: 'primary.main',
                alignSelf: 'center'
            }}
            >
            Learn More
            </Button>

            <BootstrapDialog
            onClose={handleClose}
            aria-labelledby="customized-dialog-title"
            open={open}
            >
                <DialogTitle sx={{ m: 0, p: 2 , fontWeight:'bold'}} id="customized-dialog-title">
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
                    It won’t alter or censor songs directly but will help you find clean versions when they exist.
                    
                    </Typography>
            </DialogContent>
        </BootstrapDialog>
        </Box>
      </Box>

      {
        isLargeScreen && (
            <Box sx={{width:"75%"}}>
            <img src={cloud} style={{
                opacity:'40%', 
                width:'100%',
                transform: 'scaleX(-1) translate(30%, -10%)'}}
            />
            <img src={cloud} style={{
                opacity:'40%', 
                width:'100%',
                transform: 'translate(-135%, 170%)'}}
            />
          </Box>    

        )
      }

     
      {/* Background circle - from right side on large screens */}
      <Box 
        sx={{
            position: 'absolute',
            bottom: !isLargeScreen && '-5%',
            left: !isLargeScreen && '50%',
            top: isLargeScreen && '-14%',
            right: isLargeScreen && '-56dvh', 
            width: isLargeScreen ? '130dvh' : '90dvh', 
            height: isLargeScreen ? '130dvh' : '60dvh', 
            transform: isLargeScreen ? 'none' : 'translateX(-50%)',
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #fceabb, #FFD8A8)',
            zIndex: 0,
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: 'inset 0 0 0 15px rgba(255, 255, 255, 0.1), inset 0 0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 0 45px rgba(255, 255, 255, 0.1), inset 0 0 0 60px rgba(255, 255, 255, 0.1)'
            }
        }}
      >

        {/* Displays container - centered in circle */}
        <Box 
          sx={{
            position: 'relative',
            maxWidth: '35%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            ...(isLargeScreen && {
              transform: 'translateX(-50%)', 
            }),
          }}
        >
          {/* Larger display (display_1) */}
          <Box
            sx={{
              position: 'relative',
              width: '70%',
              right: '30%',
              zIndex: 1,
            }}
          >
            <img 
              src={display_1} 
              alt="Display 1"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '8px',
              }}
            />
          </Box>

          {/* Smaller display (display_2) centered on top of display_1 */}
          <Box
            sx={{
              position: 'absolute',
              width: '75%',
              left: '40%',
              zIndex: 2,
            }}
          >
            <img 
              src={display_2} 
              alt="Display 2"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '8px',
              }}
            />
          </Box>
        </Box>
      </Box>
      <Box 
        sx={{
          mt: 'auto', 
          textAlign: 'left',
          width: '100%',
        }}
      >
     <Typography variant="caption">© 2025 auXmod. Created by Briana King.</Typography>
    </Box>

    </Container>
  );
};

export default LandingPage;