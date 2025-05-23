import React from 'react';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Container, Typography, Button, Box, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import logo from './auxmod_logo.svg';
import display_1 from './display_1.svg';
import display_2 from './display_2.svg';
import cloud from './cloud.svg';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';

const LandingDesktop = () => {
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
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <Box 
        sx={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 5,
          maxWidth: '100px', 
          display: 'flex', 
          flexDirection: 'column', 
          textAlign: 'center',
        }}
      >
        <img width="100%" src={logo} alt="auXmod logo" />
        <Typography variant='h6' color='black' sx={{fontSize:'1.5rem'}}>
          auXmod
        </Typography>
      </Box>

      {/* Main content - left side */}
      <Box 
        sx={{
          gridColumn: '1',
          pl: 4,
          mr: 4,
          textAlign: 'center',
          position: 'relative', 
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Typography variant='h3' sx={{
          fontWeight:'500',
          fontSize: '3rem'
        }} color='black'>
          Your aux, Your rules
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant='h6' sx={{
            fontWeight:'350',
            fontSize: '1.25rem'
          }}>
            Flag and filter out explicit content— 
          </Typography>
          <Typography variant='h6' sx={{
            fontWeight:'350',
            fontSize: '1.25rem'
          }}>
            Ensure playlists are safe for any space
          </Typography>
        </Box>
        
        <Box sx={{
          display: 'flex', 
          flexDirection:'row',
          justifyContent: 'center', 
          gap: 2,
          alignItems: 'center',
        }}>
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
                AuXmod is an app for playlist moderation, ensuring your playlists are safe for sensitive environments. It helps curate playlists free from explicit content while 
                preserving the music experience.
              </Typography>

              <Typography sx={{fontWeight:'bold'}} gutterBottom>
                Who is it for?
              </Typography>
              <Typography gutterBottom>
                The app is designed for anyone who wants to maintain a family-friendly or professional atmosphere without compromising on music
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

      {/* Cloud images */}
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

      {/* Background circle */}
      <Box 
        sx={{
          position: 'absolute',
          top: '50%',
          right: '-25%',
          width: '70vw',
          height: '70vw',
          transform: 'translateY(-50%)',
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #fceabb, #FFD8A8)',
          zIndex: 0,
        }}
      />

      {/* Display images */}
      <Box 
        sx={{
          position: 'absolute',
          top: '50%',
          right: '10%',
          transform: 'translateY(-50%)',
          height: '60vh',
          width: '25%',
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
              width: '75%',
              left: '-2vw',
              top: '50%',
              transform: 'translateY(-50%)',
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
                maxHeight: '70vh',
              }}
            />
          </Box>
          {/* larger display (display_2) */}
          <Box
            sx={{
              position: 'absolute',
              width: '80%',
              right: '-8vw',
              top: '50%',
              transform: 'translateY(-50%)',
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
                maxHeight: '70vh',
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

export default LandingDesktop;