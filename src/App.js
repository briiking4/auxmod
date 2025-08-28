import * as React from 'react';
import { useState, useEffect } from 'react';
import {Container, Typography, Button, Box, CircularProgress} from '@mui/material';
import Profile from './Profile';
import StepToggle from './StepToggle';
import ChoosePlaylist from './ChoosePlaylist';
import SetFilters from './SetFilters';
import SaveComponent from './SaveComponent';
import Done from './Done';
import Login from './Login';
import CleanPlaylist from './CleanPlaylist';
import GuestWelcome from './GuestWelcome';
import { setAccessToken } from './spotifyApi';
import ReactGA from 'react-ga4';
import posthog from 'posthog-js';
import { usePostHog } from 'posthog-js/react'




import FirstPageIcon from '@mui/icons-material/FirstPage';
import OnboardingSurvey from './OnboardingSurvey';
import PreviewPlaylist from './PreviewPlaylist';

// LEFT OFF: playlist_track_number carry over for find clean versions and tracks pull from cache too


export default function App() {

  // Logged in Status

  const [loggedIn, setLoggedIn] = useState(false);

  // Mode Status

  const [guestMode, setGuestMode] = useState(false);

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

  const [userId, setUserId] = useState(null); 



  // Which step is the active 

  const [activeStep, setActiveStep] = useState(0); // Default to the first step

  // Setting the status of the steps
  const [stepsStatus, setStepsStatus] = useState([false, false, false])

  //Google Analytics tracking:

  const [onboardingSurvey, setOnboardingSurvey] = useState(null)
  const [showOnboardingSurvey, setShowOnboardingSurvey] = useState(false)

  const [loadingSurveys, setLoadingSurveys] = useState(true);

  const [posthogUser, setPosthogUser] = useState(undefined);



  
  const posthog = usePostHog()

  const onboardingSurveyId = "019674db-5402-0000-02e5-f606d2ef5bc1"

  const feedbackPopUpSurveyId = '01989f84-2030-0000-6dd4-4382915e2fae'
  const feedbackPopUpQuestionId = 'eb2251a2-6ea2-45aa-a227-31311215ea4d'


  useEffect(() => {
    ReactGA.initialize('G-VKQ70YNR1N', { testMode: process.env.NODE_ENV !== 'production' });
    if(loggedIn){
      ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: "Main App - User logged in" });
      ReactGA.set({
        userId: userId, 
      });
    }
  }, []);

  const getPosthogUser = async (userId) => {
    console.log("userId", userId)
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/getPosthogUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
  
    if (!res.ok) {
      console.error('Failed to fetch user from backend');
      return null;
    }
  
    const data = await res.json();
    return data;
  };

  useEffect(() => {
    console.log("userId changed", userId)
    if (userId) {
        const fetchPosthogUser = async () => {
          const user = await getPosthogUser(userId);
          if(user.results[0]){
            setPosthogUser(user.results[0])
          }else{
            setPosthogUser(null)
          }
        };
        fetchPosthogUser();
    }
  }, [userId]);
  

  useEffect(() => {
    console.log("Posthog user changed", posthogUser)
    if (posthogUser === undefined) return;

    console.log("Posthog user", posthogUser)
    const user_onboarded = posthogUser?.properties.has_completed_onboarding_survey
    const fetchOnboardingSurvey = async () => {
      return new Promise(resolve => {
        posthog?.getActiveMatchingSurveys((surveys) => {
          console.log("Active matching Surveys:", surveys);
          const onboardingSurveyObj = surveys.find(s => s.id === onboardingSurveyId);
          if (onboardingSurveyObj) {         
            // set onboarding survey=
              setShowOnboardingSurvey(true);
              setOnboardingSurvey(onboardingSurveyObj);
                     
          }else{
            setShowOnboardingSurvey(false);
          }
          setLoadingSurveys(false);
          resolve();
        });
      });
    };
    if(user_onboarded === false){
      fetchOnboardingSurvey();
    }else{
      setShowOnboardingSurvey(false);
      setLoadingSurveys(false);
    }
  }, [posthogUser]);


const handleOnboardingSubmit = (value) => {
  setShowOnboardingSurvey(false)
  console.log("User submitted:", value)
  const response = value;
  const responseKey = `$survey_response_${onboardingSurvey.questions[0].id}`;
  console.log(responseKey)
  console.log(response)
  posthog.capture("survey sent", {
    $survey_id: onboardingSurveyId,
    [responseKey]: response,
    $set: {
      has_completed_onboarding_survey: true,
    }
  })

}

  // Recieving logged in status from the Login Compt

  const handleLoginStatus= (state) =>{
    setLoggedIn(state);
  }

  
  const handleGuestModeStatus= (state) =>{
    console.log("GOT GUEST MODE: ", state )
    setGuestMode(state);
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
    posthog.reset(); // clear anon ID and person properties

    posthog?.identify(info.userId, {
      userId: info.userId,
      name: info.name
    })

    setUserId(info.userId)

      

    // Check if identification worked correctly
    // const currentDistinctId = posthog.get_distinct_id();
    
    // if (currentDistinctId === info.userId) {
    //   console.log("Identify worked!")
    //   setUserId(info.userId);
    // } else {
    //   // If not immediately successful, wait a bit and check again
    //   setTimeout(() => {
    //     const retryDistinctId = posthog.get_distinct_id();
    //     if (retryDistinctId === info.userId) {
    //       setUserId(info.userId);
    //     } else {
    //       console.error("PostHog identification failed after retry");
    //     }
    //   }, 500);
    // }
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
      },
      height: '100dvh',
      display:'flex',
      flexDirection:'column',
      backgroundColor:'transparent'
      }}>
    
    { !loggedIn && !guestMode ? (
      <Login sendLoginStatus={handleLoginStatus} sendAccessToken={handleAccessToken} sendGuestModeStatus={handleGuestModeStatus}/>
    ) : (
      <>

      {
        guestMode ? 
         <>
          <GuestWelcome></GuestWelcome>
          <Profile sendUserInfo={handleUserInfo} guestMode={guestMode}/>

          <StepToggle stepsStatus={stepsStatus} activeStep={activeStep}/>
            {
              activeStep === 0 ? 
                <ChoosePlaylist sendStatus={handleStepsStatus} sendChosenPlaylist={handleChosenPlaylist} guestMode={guestMode}/>
              : activeStep === 1 ?
                <SetFilters onApplyFilters={handleApplyFilters} chosenPlaylist={chosenPlaylist} 
                  sendChosenFilters={handleChosenFilters} sendStatus={handleStepsStatus} 
                  progress={cleaningProgress}/>
              : activeStep === 2 ?
              <>
                {!stepsStatus[2] ? 
                  <SaveComponent sendStatus={handleStepsStatus} cleanedPlaylist={cleanedPlaylist} 
                    chosenFilters={chosenFilters} userId={userId} sendSavedPlaylist={handleSavedPlaylist} guestMode={guestMode}/>
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
                        setStepsStatus([false, false, false]);
                        ReactGA.event({
                          category: 'User',
                          action: `Clean another playlist Clicked`
                        });
                      }}
                    >
                      <FirstPageIcon/>
                      Clean Another Playlist
                    </Button>
                  </Container>
                </> 
                }
              </>
              : <></>
            }
            <Box
              sx={{
                mt: 'auto',
                textAlign: 'left',
                width: '100%',
                display: 'flex',
                flexDirection:'column',
                pt:2
              }}
            >
              <Box sx={{ display: 'flex', flexDirection:"row", gap: 1, justifyContent: 'end' }}>
              <a
                  href="https://www.buymeacoffee.com/brianakingt"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block' }}
                >
                  <img
                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                    alt="Buy Me A Coffee"
                    style={{ height: '40px', width: '145px', display: 'block' }}
                  />
                </a>
                <Button id="feedback-button" variant="contained" size="small" sx={{backgroundColor:'#E89D7A'}}>
                  Leave feedback
                </Button>
              </Box>
              <Typography variant="caption" sx={{mb:-2, alignSelf:'center'}}>© 2025 auXmod. Created by Briana King.</Typography>
            </Box>
              </>

        :
        <>

        <Profile sendUserInfo={handleUserInfo}/>
        
        {loadingSurveys ? (
          <CircularProgress sx={{margin:'auto'}} /> 
        ) : showOnboardingSurvey && onboardingSurvey ? (
          <OnboardingSurvey survey={onboardingSurvey} onSubmit={handleOnboardingSubmit}/>
        ) : (
          // Main app flow components (Profile is already visible above)
          <>
            <StepToggle stepsStatus={stepsStatus} activeStep={activeStep}/>
            {
              activeStep === 0 ? 
                <ChoosePlaylist sendStatus={handleStepsStatus} sendChosenPlaylist={handleChosenPlaylist}/>
              : activeStep === 1 ?
                <SetFilters onApplyFilters={handleApplyFilters} chosenPlaylist={chosenPlaylist} 
                  sendChosenFilters={handleChosenFilters} sendStatus={handleStepsStatus} 
                  progress={cleaningProgress}/>
              : activeStep === 2 ?
              <>
                {!stepsStatus[2] ? 
                  <SaveComponent sendStatus={handleStepsStatus} cleanedPlaylist={cleanedPlaylist} 
                    chosenFilters={chosenFilters} userId={userId} sendSavedPlaylist={handleSavedPlaylist}/>
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
                        setStepsStatus([false, false, false]);
                        ReactGA.event({
                          category: 'User',
                          action: `Clean another playlist Clicked`
                        });
                      }}
                    >
                      <FirstPageIcon/>
                      Clean Another Playlist
                    </Button>
                  </Container>
                </> 
                }
              </>
              : <></>
            }
            <Box
              sx={{
                mt: 'auto',
                textAlign: 'left',
                width: '100%',
                display: 'flex',
                flexDirection:'column',
                pt:2
              }}
            >
              <Box sx={{ display: 'flex', flexDirection:"row", gap: 1, justifyContent: 'end' }}>
              <a
                  href="https://www.buymeacoffee.com/brianakingt"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block' }}
                >
                  <img
                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                    alt="Buy Me A Coffee"
                    style={{ height: '40px', width: '145px', display: 'block' }}
                  />
                </a>
                <Button id="feedback-button" variant="contained" size="small" sx={{backgroundColor:'#E89D7A'}}>
                  Leave feedback
                </Button>
              </Box>
              <Typography variant="caption" sx={{mb:-2, alignSelf:'center'}}>© 2025 auXmod. Created by Briana King.</Typography>
            </Box>
          </>
        )}
        </>
      }
        
      </>
    )}
    </Container>
  );
}
