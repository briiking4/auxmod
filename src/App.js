import * as React from 'react';
import { useState, useEffect } from 'react';
import {Container, Typography, Button, Box} from '@mui/material';
import Profile from './Profile';
import StepToggle from './StepToggle';
import ChoosePlaylist from './ChoosePlaylist';
import SetFilters from './SetFilters';
import SaveComponent from './SaveComponent';
import Done from './Done';
import Login from './Login';
import CleanPlaylist from './CleanPlaylist';
import { setAccessToken } from './spotifyApi'; 

import FirstPageIcon from '@mui/icons-material/FirstPage';

// Deploy: host backend on render

// login page - logo / name change
// make a landing page?? or add stuff on the app login? 

// ADD: gtag google analytics 

export default function App() {

  // Logged in Status

  const [loggedIn, setLoggedIn] = useState(false);

  // Access token state (have it or not)

    const [accessTokenState, setAccessTokenState] = useState(false);

  //Chosen playlist

  const [chosenPlaylist, setChosenPlaylist] = useState({});

  //Chosen playlist

  const [chosenFilters, setChosenFilters] = useState([]);

  // Cleaning Progress

  const [cleaningProgress, setCleaningProgress] = useState(0);

  //Cleaned Playlist 

  const [cleanedPlaylist, setCleanedPlaylist] = useState(null)

  // Saved Playlist (the id of the cleaned playlist once the user saves it to their lib)

  const [savedPlaylist, setSavedPlaylist] = useState(null)

  const [userId, setUserId] = useState(null); // Assume this is fetched on login



  // Which step is the active 

  const [activeStep, setActiveStep] = useState(0); // Default to the first step

  // Setting the status of the steps
  const [stepsStatus, setStepsStatus] = useState([false, false, false])


  // Recieving logged in status from the Login Compt

  const handleLoginStatus= (state) =>{
    setLoggedIn(state);
  }

  // Recieving the access token from the Login Compt

  const handleAccessToken = (token) =>{
      console.log("Got the access token: ", token);
      setAccessTokenState(token); 
      setAccessToken(token); // Call the function from inside spotifyApi instance to set the access token
  }

  // Recieving the userId

  const handleUserInfo = (info) => {
    console.log(info);
    setUserId(info.userId);
  }

  // Recieving the step status of Step 1 from the Choose Playlist Component 

  const handleStepsStatus = (state) => {
    console.log("Handling step status...")
    console.log("Current Step Status", stepsStatus)
    console.log("Recieved", state);
    console.log("Current active steo", activeStep);

  
    // Check which step the activeStep is
    if (activeStep === 0) {
      console.log("App Component: Status has changed to " + state + " for Step 1");
      if (state) {
        setStepsStatus((prevList) => {
          const updatedStepsStatus = [...prevList];
          updatedStepsStatus[0] = true; // Mark Step 1 as complete
          return updatedStepsStatus;
        });
        setActiveStep(1);
      } else {
        setActiveStep(0); // Remain at Step 0
      }
    }
    if (activeStep === 1) {
      console.log("App Component: Status has changed to " + state + " for Step 2");
      if (state) {
        setStepsStatus((prevList) => {
          const updatedStepsStatus = [...prevList];
          updatedStepsStatus[1] = true; // Mark Step 2 as complete
          return updatedStepsStatus;
        });
        setActiveStep(2);
      } else {
        setStepsStatus((prevList) => {
          const updatedStepsStatus = [...prevList];
          updatedStepsStatus[1] = false; // Reset Step 2 status
          return updatedStepsStatus;
        });
        setActiveStep(0); // Navigate back to Step 0
        setStepsStatus([false, false, false])
      }
    }
    if (activeStep === 2) {
      console.log("App Component: Status has changed to " + state + " for Step 3");
      if (state) {
        setStepsStatus((prevList) => {
          const updatedStepsStatus = [...prevList];
          updatedStepsStatus[2] = true; // Mark Step 3 as complete
          return updatedStepsStatus;
        });
      } else {
        setStepsStatus((prevList) => {
          const updatedStepsStatus = [...prevList];
          updatedStepsStatus[2] = false; // Reset Step 3 status
          updatedStepsStatus[1] = false; // Reset Step 3 status
          return updatedStepsStatus;
        });
        setActiveStep(1); // Navigate back to Step 1
      }
    }
  };
  

  //Recieving the Chosen Playlist from Step 1 Completion 

  const handleChosenPlaylist= (playlist) =>{
    console.log("Chosen Playlist: ")
    console.log(playlist)
    setChosenPlaylist(playlist)
  }

  // Recieving the chosen filters 
  const handleChosenFilters = (filters) => {
    console.log("App compt: Chosen Filters are: ")
    console.log(filters);
    setChosenFilters(filters);
  }

// LEFT OFF: onprog update
  const handleApplyFilters = async (filters) => {            
    try {
      // reset cleaning progress
      setCleaningProgress(0)
      console.log("APP: Handling apply filters");
      let playlist_id = chosenPlaylist.id;
      console.log("APP (handle apply filters): Chosen Playlist Id: ")
      console.log(playlist_id)

      console.log("handling apply filters in APP. they are: ", filters)

      const handleProgressUpdate = (progress) => {
        console.log(`Progress: ${progress}%`);
        setCleaningProgress(progress)
      };
  
      const cleanedPlaylist = await CleanPlaylist(playlist_id, filters, handleProgressUpdate);

      console.log("Cleaned Playlist: ")

      console.log(cleanedPlaylist)

      setCleanedPlaylist(cleanedPlaylist);
      handleStepsStatus([true]); 

    } catch (error) {
      console.error('Error cleaning playlist:', error);
    }
  };

  const handleSavedPlaylist = (id) => {
    setSavedPlaylist(id)
  }

  return (
    <Container 
      sx={{
        p:'16px',
        maxWidth: {
        mobile: '100%',  // Mobile 
        tablet: '100%',  // Tablet 
        laptop: '1024px', // Laptop 
        desktop: '1200px', // Desktop devices
        maxHeight: '100lvh',  // Full dynamic viewport height when avalible
        minHeight: '100svh', // Minimum height based on smallest viewport height (address bar visible)
        overflow: 'hidden', // Prevents overflow when viewport height changes
        display: 'flex',   // Flexbox layout to adjust content inside
        flexDirection: 'column', // Arrange components vertically
      },
      }}>

      { !loggedIn?
        <Login sendLoginStatus={handleLoginStatus} sendAccessToken={handleAccessToken}/>
      :
      <Box 
      sx={{
        width: '100%',
        height: 'auto',
        maxHeight: '100%',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        transform: 'scale(var(--scale, 1))',
        transformOrigin: 'top center',
      }}
      ref={(el) => {
        if (el) {
          const setScale = () => {
            // Use a small timeout to ensure accurate measurements
            setTimeout(() => {
              // Use visual viewport height which accounts for URL bar
              const viewportHeight = window.visualViewport ? 
                window.visualViewport.height - 48 : // Use visual viewport when available
                window.innerHeight - 48; // Fallback
                
              const contentHeight = el.scrollHeight;
              // Apply safety buffer
              const scale = contentHeight > viewportHeight ? 
                ((viewportHeight / contentHeight) * 0.95) : 1;
              
              el.style.setProperty('--scale', scale);
            }, 50);
          };
          
          // Initial calculation
          setScale();
          
          // Update on resize
          window.addEventListener('resize', setScale);
          
          // Handle visual viewport changes (for mobile browsers with dynamic URL bars)
          if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', setScale);
            window.visualViewport.addEventListener('scroll', setScale);
          }
          
          // Handle content changes
          const observer = new MutationObserver(setScale);
          observer.observe(el, { childList: true, subtree: true });
          
          return () => {
            window.removeEventListener('resize', setScale);
            if (window.visualViewport) {
              window.visualViewport.removeEventListener('resize', setScale);
              window.visualViewport.removeEventListener('scroll', setScale);
            }
            observer.disconnect();
          };
        }
      }}
    >
  
        <Profile sendUserInfo={handleUserInfo}/>
        <StepToggle stepsStatus={stepsStatus} activeStep={activeStep}/>
        {
          activeStep === 0 ? 
            <ChoosePlaylist sendStatus={handleStepsStatus} sendChosenPlaylist={handleChosenPlaylist}/>
          :
          activeStep === 1 ?
          <SetFilters onApplyFilters={handleApplyFilters} chosenPlaylist={chosenPlaylist} sendChosenFilters={handleChosenFilters} sendStatus={handleStepsStatus} progress={cleaningProgress}/>
          :
          activeStep === 2 ?
          <>
            {
              !stepsStatus[2] ? 
                <Container sx={{mt:1, p:0}}>
                  <SaveComponent sendStatus={handleStepsStatus} cleanedPlaylist={cleanedPlaylist} chosenFilters={chosenFilters} userId={userId} sendSavedPlaylist={handleSavedPlaylist}/>
                </Container>
              
              :
              <>
                <Done savedPlaylist={savedPlaylist} originalPlaylistName={chosenPlaylist.name}/>
                <Container
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    '& .MuiButtonBase-root': {
                    borderRadius: '50px',
                    },
                    p:0,
                    mt:13
                }}
                >
                <Button 
                variant="contained" 
                sx={{ minWidth: '170px', minHeight:'40px' }}
                onClick={() => {
                  console.log("Clean again");
                  setActiveStep(0);
                  setStepsStatus([false, false, false])
                }}
                >
                  <FirstPageIcon/>
                  Clean Another Playlist
                </Button>
                </Container>
              </> 
  
          }
          </>
          :
          <></>
        }
      </Box>
    }

  </Container>

  );
}
