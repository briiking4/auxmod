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

  console.log("is it a large screen?", isLargeScreen)

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
        pb: { mobile: '12dvh', tablet: 4 }, // Dynamic padding using dvh
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
          mt: { mobile: 2, tablet: 3 },
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
          mt: {tablet: 10 }, 
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
          }),
          transform: 'translateY(35%)'
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

     
      {/* Background circle - from right side on large screens, half-circle from bottom on mobile */}
      <Box 
        sx={{
            position: 'absolute',
            bottom: !isLargeScreen ? '-50%' : 'auto', 
            left: !isLargeScreen ? '50%' : 'auto',
            top: isLargeScreen ? '-14%' : 'auto',
            right: isLargeScreen ? '-56dvh' : 'auto', 
            width: { 
              mobile: '200%', 
              tablet: '180%', 
              laptop: '135dvh' 
            }, 
            height: { 
              mobile: '100dvh', // Dynamic height
              tablet: '100dvh', // Dynamic height
              laptop: '135vh' 
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
      />

      {/* Display images container - positioned independently for mobile/tablet */}
      <Box 
        sx={{
          position: 'absolute',
          bottom: {
            mobile: '10dvh', // Close to bottom of visible area
            tablet: '4dvh',
          },
          left: '50%',
          transform: 'translateX(-50%)',
          width: {
            mobile: '60%', 
            tablet: '35%',
          },
          display: !isLargeScreen ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1,
          // Make sure the images stay within the circle bounds
          maxHeight: {
            mobile: '28dvh',
            tablet: '28dvh'
          },
        }}
      >
        {/* Larger display (display_1) */}
        <Box
          sx={{
            position: 'relative',
            width: '70%',
            right: '30%',
            // Scale down if needed to fit within circle
            maxWidth: {
              mobile: '100%',
              tablet: '100%'
            },
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
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>

        {/* Smaller display (display_2) centered on top of display_1 */}
        <Box
          sx={{
            position: 'absolute',
            width: '75%',
            left: '40%',
            // Scale down if needed to fit within circle
            maxWidth: {
              mobile: '100%',
              tablet: '100%'
            },
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
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
      </Box>

      {/* Display images for large screen - inside circle */}
      {isLargeScreen && (
        <Box 
          sx={{
            position: 'relative',
            // Using percentage of parent container
            maxWidth: {
              laptop: '50%',
              desktop: '50%'
            },
            // Use height constraint to ensure it stays in circle
            maxHeight: '60%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gridColumn: '2',
            alignSelf: 'center',
            justifySelf: 'center',
            zIndex: 1,
            // Add this to ensure the images are contained within the circle
            overflow: 'visible',
            // This will help position the images relative to the circle
            marginRight: '10%',
            transform: 'translate(20dvh)',
            top:'-75%'
          }}
        >
          {/* Larger display (display_1) */}
          <Box
            sx={{
              position: 'relative',
              width: '70%',
              right: '30%',
              // Ensure image scales appropriately
              maxHeight: '100%',
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
                objectFit: 'contain'
              }}
            />
          </Box>

          {/* Smaller display (display_2) centered on top of display_1 */}
          <Box
            sx={{
              position: 'absolute',
              width: '75%',
              left: '40%',
              // Ensure image scales appropriately
              maxHeight: '100%',
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
                objectFit: 'contain'
              }}
            />
          </Box>
        </Box>
      )}

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