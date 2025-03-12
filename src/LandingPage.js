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
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'));
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
          mobile: '100%',
          tablet: '100%',
          laptop: '100%',
          desktop: '100%',
        },
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(90deg, #87ceeb, #FFD8A8)',
        position: 'relative',
        overflow: 'hidden', 
        px: { mobile: 2, tablet: 3 },
        pb: { mobile: '12dvh', tablet: 4 },
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
          maxWidth: '100px', 
          display: 'flex', 
          flexDirection: 'column', 
          textAlign: 'center',
          mt: { mobile: 1, tablet: 3 },
          ...(isLargeScreen && {
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 5,
          }),
        }}
      >
        <img width="100%" src={logo} alt="auXmod logo" />
        <Typography variant='h6' color='black' sx={{fontSize:'1.5rem'}}>
          auXmod
        </Typography>
      </Box>


      {/* Main content - on left side for large screens */}
      <Box 
        sx={{
          mb: { tablet: 1 },
          textAlign: 'center',
          position: 'relative', 
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          ...(isLargeScreen && {
            gridColumn: '1',
            pl: 4,
            mr: 4, // Add margin to ensure content doesn't touch circle
          }),
          // Adjusted positioning to avoid touching the circle
          transform: isLargeScreen ? 'translateY(0)' : 'translateY(20%)',
          marginTop: isLargeScreen ? '10vh' : 0
        }}
      >
        <Typography variant='h3' sx={{
          fontWeight:'500',
          fontSize: { mobile: '2rem', tablet: '2.5rem', laptop: '3rem' }
        }} color='black'>
          Your aux, Your rules
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant='h6' sx={{
            fontWeight:'350',
            fontSize: { mobile: '1rem', tablet: '1.25rem' }
          }}>
            Flag and filter out explicit content— 
          </Typography>
          <Typography variant='h6' sx={{
            fontWeight:'350',
            fontSize: { mobile: '1rem', tablet: '1.25rem' }
          }}>
            Ensure playlists are safe for any space
          </Typography>
        </Box>
        
        <Box sx={{
          display: 'flex', 
          flexDirection:'row',
          justifyContent: 'center', 
          gap: { mobile: 1, tablet: 2 },
          alignItems: 'center',
          mb: { mobile: 3, tablet: 0 }
        }}>
            <Button 
            component={Link} 
            to="/app" 
            variant="contained" 
            sx={{ 
                mt: { mobile: 2, tablet: 4 },
                borderRadius: '50px', 
                px: 4,
                py: 1.5,
                fontSize: { mobile: '1rem', tablet: '1.1rem' },
                backgroundColor: 'secondary.main',
                width: { mobile: '80%', tablet: 'auto' }
            }}
            >
            Try now!
            </Button>

            <Button 
            variant="contained" 
            onClick={handleClickOpen}
            sx={{ 
                mt: { mobile: 2, tablet: 4 },
                borderRadius: '50px', 
                px: 4,
                py: 1.5,
                fontSize: { mobile: '1rem', tablet: '1.1rem' },
                backgroundColor: 'primary.main',
                width: { mobile: '80%', tablet: 'auto' }
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
                    It won't alter or censor songs directly but will help you find clean versions when they exist.
                    
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

     
      {/* Background circle - from right side on large screens, half-circle from bottom on mobile
      <Box 
        sx={{
            position: 'absolute',
            bottom: !isLargeScreen ? '-50%' : 'auto', 
            left: !isLargeScreen ? '50%' : 'auto',
            top: isLargeScreen ? '-14%' : 'auto',
            right: isLargeScreen ? '-35%' : 'auto', // Adjusted to come just shy of center
            width: { 
              mobile: '200%', 
              tablet: '180%', 
              laptop: '120dvh' // Reduced size to fit less than half the viewport
            }, 
            height: { 
              mobile: '100dvh', 
              tablet: '100dvh', 
              laptop: '120dvh' 
            }, 
            transform: !isLargeScreen ? 'translateX(-50%)' : 'none',
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #fceabb, #FFD8A8)',
            zIndex: 0,
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: 'inset 0 0 0 15px rgba(255, 255, 255, 0.1), inset 0 0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 0 45px rgba(255, 255, 255, 0.1), inset 0 0 0 60px rgba(255, 255, 255, 0.1)'
            }
        }}
      /> */}

{/* Background circle - from right side on large screens, half-circle from bottom on mobile */}
<Box 
  sx={{
    position: 'absolute',
    bottom: !isLargeScreen ? '-50%' : 'auto', 
    left: !isLargeScreen ? '50%' : 'auto',
    top: isLargeScreen ? '50%' : 'auto',
    right: isLargeScreen ? '-25%' : 'auto', // Position circle to extend ~45% into viewport
    width: { 
      mobile: '200%', 
      tablet: '180%', 
      laptop: '70vw' // Use vw units to make width responsive to viewport width
    }, 
    height: { 
      mobile: '105dvh', 
      tablet: '100dvw', 
      laptop: '70vw' // Match height to width to maintain circle shape
    }, 
    transform: isLargeScreen ? 'translateY(-50%)' : 'translateX(-50%)',
    borderRadius: '50%',
    background: 'linear-gradient(180deg, #fceabb, #FFD8A8)',
    zIndex: 0,
  }}
/>

  {/* Display images - responsive for all screen sizes */}
  <Box 
    sx={{
      position: 'absolute',
      ...(isLargeScreen ? {
        top: '50%',
        right: '10%',
        transform: 'translateY(-50%)',
        height: '60vh',
        width: '25%',
      } : {
        top: '48%',
        left: '50%',
        transform: 'translate(-50%, -40%)',
        height: 'auto',
        width: '80%',
        maxWidth: '280px',
      }),
      zIndex: 1,
      display: 'block',
      pointerEvents: 'none'
    }}
  >
    {/* Container for the overlapping images */}
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {/* smaller display (display_1) */}
      <Box
        sx={{
          position: 'absolute',
          ...(isLargeScreen ? {
            width: '75%',
            left: '-2vw',
            top: '50%',
            transform: 'translateY(-50%)',
          } : {
            width: '80%',
            left: '-12vw',
            top: '0',
            transform: 'translateY(0)',
          }),
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
            objectFit: 'contain',
            maxHeight: isLargeScreen ? '70vh' : '50vh',
          }}
        />
      </Box>
      {/* larger display (display_2) */}

      <Box
        sx={{
          position: 'absolute',
          ...(isLargeScreen ? {
            width: '80%',
            right: '-8vw',
            top: '50%',
            transform: 'translateY(-50%)',
          } : {
            width: '80%',
            right: '-12vw',
            top: '15%',
            transform: 'translateY(0)',
          }),
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
            objectFit: 'contain',
            maxHeight: isLargeScreen ? '70vh' : '50vh',
          }}
        />
      </Box>
    </Box>
  </Box>

      <Box 
        sx={{
          position: 'fixed',
          bottom: 0,
          width: '100%',
          textAlign: 'left',
          zIndex: 2,
          p: 2,
        }}
      >
          <Typography variant="caption">© 2025 auXmod. Created by Briana King.</Typography>
      </Box>
  </Container>
    );
  };
  
  export default LandingPage;