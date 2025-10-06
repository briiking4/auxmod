import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button, Box, Typography, IconButton, Snackbar, Alert, Tooltip, Chip, ToggleButtonGroup, ToggleButton} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PreviewPlaylist from './PreviewPlaylist';
import spotifyApi from './spotifyApi';



import ProfanityIcon from './ProfanityIcon';
import ViolenceIcon from './ViolenceIcon';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DiscFullIcon from '@mui/icons-material/DiscFull';
import CloseIcon from '@mui/icons-material/Close';

import ErrorIcon from '@mui/icons-material/Error';
import MusicOffIcon from '@mui/icons-material/MusicOff';
import BlockIcon from '@mui/icons-material/Block';

import InfoIcon from '@mui/icons-material/Info';

import SoapIcon from '@mui/icons-material/Soap';
import VerifiedIcon from '@mui/icons-material/Verified';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SafetyCheckIcon from '@mui/icons-material/SafetyCheck';



import ReactGA from 'react-ga4';
import { Helmet } from 'react-helmet';




export default function SaveComponent({ sendStatus, cleanedPlaylist, chosenFilters, userId, sendSavedPlaylist, guestMode }) {
  const [view, setView] = useState('included');
  const [loading, setLoading] = useState(false);
  const [localCleanedPlaylist, setLocalCleanedPlaylist] = useState(cleanedPlaylist)
  const [open, setOpen] = React.useState(false);
  const [includeTrack, setIncludeTrack] = useState(null)
  const [excludeTrack, setExcludeTrack] = useState(null)
  const [originalIndexIncluded, setOriginalIndexIncluded] = useState(null);
  const [originalIndexExcluded, setOriginalIndexExcluded] = useState(null);
  const [selectedReasons, setSelectedReasons] = useState([]);


   // Google Analytics tracking:

   useEffect(() => {
      ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: "Review & Save Playlist" });
      setLocalCleanedPlaylist(cleanedPlaylist);
  }, []);

  const displayedTracks = (
    view === 'included' ? localCleanedPlaylist?.tracksAdded || [] : localCleanedPlaylist?.excludedTracks || []
  ).filter(track => {
      if (selectedReasons.length === 0) return true;

      return selectedReasons.some(reason => {
        if (reason === 'whitelist') {
          return track.trackAnalysis?.profanity?.whitelistedWordsFound?.length > 0;
        }
        if (reason === 'blacklist') {
          return track.trackAnalysis?.profanity?.customBlacklistedWordsFound?.length > 0;
        }
        if (reason === 'Profanity') {
          return track.reason.includes('Profanity') && 
                 (track.trackAnalysis?.profanity?.customBlacklistedWordsFound?.length === 0);
        }
        return track.reason?.includes(reason);
      });
    }
  );

  const appearingReasons = new Set();

  (view === 'included'
    ? localCleanedPlaylist?.tracksAdded
    : view === 'excluded'
    ? localCleanedPlaylist?.excludedTracks
    : []
  )?.forEach(track => {
    if (track.reason) {
      track.reason.forEach(r => appearingReasons.add(r));
    }
    if (track.trackAnalysis?.profanity?.whitelistedWordsFound?.length > 0) {
      appearingReasons.add('whitelist');
    }
    if (track.trackAnalysis?.profanity?.customBlacklistedWordsFound?.length > 0) {
      appearingReasons.add('blacklist');
    }
  });
  


  console.log("DISPLAYED TRACKS", displayedTracks)
  console.log("SELECTED REASONS", selectedReasons)

  

  const sendStepStatus = (state) => {
    console.log("Step 3 complete: Sending status:", state);
    sendStatus(state);
  };

  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  
  async function CreateCleanedPlaylist(playlist) {
    const newPlaylist = await spotifyApi.createPlaylist(userId, {
      name: `${playlist.name}`,
      description: `Clean version of ${playlist.name} without ${formatter.format(chosenFilters)} content. Filtered using auXmod.`,
    });

    const trackUris = playlist.tracksAdded.map((track) => track.uri);
    const batchSize = 100;
    
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      await spotifyApi.addTracksToPlaylist(newPlaylist.id, batch);
    }
    
    sendSavedPlaylist(newPlaylist.id);
    console.log("Playlist created! Go check Spotify");
  }
  
  const handleSave = async () => {
    ReactGA.event({
      category: 'User',
      action: `Save to Library Clicked`
    });
    setLoading(true);
    await CreateCleanedPlaylist(localCleanedPlaylist);
    sendStepStatus(true);
  };

  const handleIncludeAnyway = (track) => {
    console.log("included anyway", track);
    
    // find the index of the track in excludedTracks array before removing it
    const excludedIndex = localCleanedPlaylist.excludedTracks.findIndex(
      (excludedTrack) => excludedTrack.id === track.id
    );

    // store the track and its original index
    setIncludeTrack(track);
    setOriginalIndexExcluded(excludedIndex);
    setOpen(true);
    
    
    ReactGA.event({
      category: 'User',
      action: 'Include Excluded Track'
    });

    // deep copy of the current playlist state
    const updatedPlaylist = JSON.parse(JSON.stringify(localCleanedPlaylist));
    
    // Add the track to tracksAdded array
    updatedPlaylist.tracksAdded.push(track);
    
    // Remove the track from excludedTracks array
    updatedPlaylist.excludedTracks = updatedPlaylist.excludedTracks.filter(
      (excludedTrack) => excludedTrack.id !== track.id
    );
    console.log("the updated playlist is: ", updatedPlaylist)
    setLocalCleanedPlaylist(updatedPlaylist);
  };

  const handleExcludeTrack = (track) => {
    console.log("excluded ", track);
    // find the index of the track in included array before removing it
    const includedIndex = localCleanedPlaylist.tracksAdded.findIndex(
      (includedTrack) => includedTrack.id === track.id
    );

    // store the track and its original index
    setExcludeTrack(track);
    setOriginalIndexIncluded(includedIndex);
    setOpen(true);
        
    
    
    ReactGA.event({
      category: 'User',
      action: 'Include Excluded Track'
    });

    // deep copy of the current playlist state
    const updatedPlaylist = JSON.parse(JSON.stringify(localCleanedPlaylist));
    
    // Add the track to excludedTracks array
    updatedPlaylist.excludedTracks.push(track);
    
    // Remove the track from tracksAdded array
    updatedPlaylist.tracksAdded = updatedPlaylist.tracksAdded.filter(
      (includedTrack) => includedTrack.id !== track.id
    );
    console.log("the updated playlist is: ", updatedPlaylist)
    setLocalCleanedPlaylist(updatedPlaylist);
  };

  


  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  const handleUndo = (view) => {
    // deep copy of the current playlist state
    const updatedPlaylist = JSON.parse(JSON.stringify(localCleanedPlaylist));

    if(view === 'excluded'){
    // remove the track from tracksAdded array
    updatedPlaylist.tracksAdded = updatedPlaylist.tracksAdded.filter(
      (includedTrack) => includedTrack.id !== includeTrack?.id
    );
    
    // add the track back to excludedTracks array at its original index
    if (originalIndexExcluded !== null && originalIndexExcluded >= 0) {
      updatedPlaylist.excludedTracks.splice(originalIndexExcluded, 0, includeTrack);
    } else {
      // fallback in case the index isn't available
      updatedPlaylist.excludedTracks.push(includeTrack);
    }
     
    console.log("the updated playlist is: ", updatedPlaylist);
    setLocalCleanedPlaylist(updatedPlaylist);

    }else
    if(view === 'included'){
      // remove the track from excludedTracks array
    updatedPlaylist.excludedTracks = updatedPlaylist.excludedTracks.filter(
      (excludedTrack) => excludedTrack.id !== excludeTrack?.id
    );
    
    // add the track back to excludedTracks array at its original index
    if (originalIndexIncluded !== null && originalIndexIncluded >= 0) {
      updatedPlaylist.tracksAdded.splice(originalIndexIncluded, 0, excludeTrack);
    } else {
      // fallback in case the index isn't available
      updatedPlaylist.tracksAdded.push(excludeTrack);
    }
     
    console.log("the updated playlist is: ", updatedPlaylist);
    setLocalCleanedPlaylist(updatedPlaylist);

    }

    setOpen(false);
  }

  const undo = (viewType) => (
    <>
      <Button color="primary" size="small" onClick={() => handleUndo(viewType)}>
        UNDO
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </>
  );


  return (
  <>
    <Helmet>
      <title>Review & Save Playlist | auXmod</title>
      <meta name="description" content="Review tracks that passed or failed your content filters - Profanity, Sexual Content, Violent Content. Save the cleaned version to your Spotify library." />
    </Helmet>
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', flexDirection: 'row', flexShrink: 0}}>
        
        <Box sx={{display:'flex', flexDirection:'column'}}>

          <Box sx={{display:'flex', flexDirection:'row', alignItems:'center'}}>
            <Typography variant="h6">{cleanedPlaylist?.name} </Typography>

            <FiberManualRecordIcon sx={{fontSize:'10px', mx:1}}/>

            <Typography variant="caption">
              {(localCleanedPlaylist?.tracksAdded.length) + " songs"}
            </Typography>

          </Box>

          <Typography variant="caption">Filters: {chosenFilters.join(', ')}</Typography>

        </Box>

      </Box>

      {localCleanedPlaylist ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          mt:2,
          alignItems:'center'
        }}>
          {/* Toggle Buttons */}
          <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(e, newView) => newView && setView(newView)}
          sx={{ borderRadius: '100px', overflow: 'hidden' }}
        >
          <ToggleButton
            value="included"
            sx={{
              px: 3,
              border:'none',
              bgcolor: view === 'included' ? 'secondary.main' : 'secondary.light',
              color: 'text.primary',
              '&.Mui-selected': {
                bgcolor: 'secondary.main',
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'secondary.main', 
                },
              },
            }}
          >
            
            <Box sx={{display: 'flex', alignItems:'center', }}>
              <Tooltip title="Tracks that passed your filters or a clean version replacement was found." enterTouchDelay={0} leaveTouchDelay={3000}> 
                <InfoIcon sx={{marginRight: "5px"}}fontSize="small" />
              </Tooltip>
            </Box>
              Passed ({localCleanedPlaylist.tracksAdded.length}) 
          </ToggleButton>
            <ToggleButton
              value="excluded"
              sx={{
                px: 3,
                border:'none',
                bgcolor: view === 'excluded' ? 'secondary.main' : 'secondary.light',
                color: 'text.primary',
                '&.Mui-selected': {
                  bgcolor: 'secondary.main',
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'secondary.main', 

                  },
                },
              }}
            >
                          
            <Box sx={{display: 'flex', alignItems:'center', }}>
              <Tooltip title="Tracks that did not pass your filters or no clean version was found."  enterTouchDelay={0} leaveTouchDelay={3000}> 
                <InfoIcon sx={{marginRight: "5px"}}fontSize="small" />
              </Tooltip>
            </Box>
            Removed ({localCleanedPlaylist.excludedTracks.length}) 
            </ToggleButton>
        </ToggleButtonGroup>



            {/* Filter Message */}
            <Box sx={{ mb: 1, flexShrink: 0, textAlign:'center'}}>
              {/* <Typography variant="caption">
                {view === 'included'
                  ? displayedTracks.length > 0
                    ? chosenFilters.includes('Profanity')
                      ? 'Passed filter(s) or found a clean replacement'
                      : 'Passed filter(s)'
                    : chosenFilters.includes('Profanity')
                      ? 'No tracks passed the filter(s) and no clean version replacement was found.'
                      : 'No tracks passed the filter(s)'
                  : displayedTracks.length > 0
                    ? chosenFilters.includes('Profanity')
                      ? 'Failed filter(s) or lacks a valid clean version replacement'
                      : 'Failed filter(s)'
                    : chosenFilters.includes('Profanity')
                      ? 'All tracks either passed filter(s) or a clean version replacement was found!'
                      : 'All tracks passed the filter(s)!'}
              </Typography> */}
              {/* Table Reason Ledgend */}
              {
                view === 'excluded' && (
                  <>
                    {/* <Alert severity="info" sx={{textAlign:'left', display:'flex', width: 'fit-content', mx:'auto'}}>If profanity is the only "reason" listed, no clean version was found. Feel free to add back any songs you want to include!</Alert> */}

                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        flexWrap: 'wrap', 
                        gap: 1, 
                        mt:2
                      }}
                    >
                      {[
                        { icon: <ProfanityIcon sx={{marginLeft:'8px'}}/>, label: 'Profanity', name:'Profanity' },
                        { icon: <ViolenceIcon />, label: 'Violence', name:'Violence' },
                        { icon: <LocalFireDepartmentIcon />, label: 'Sexual', name:'Sexual' },
                        { icon: <MusicOffIcon />, label: 'No lyrics', name:'No score' },
                        { icon: <BlockIcon />, label: 'Blocked word', name:'blacklist'}
                      ]
                      .filter(item => appearingReasons.has(item.name))
                      .map((item, index) => (
                        <Chip
                          key={index}
                          icon={item.icon}
                          label={item.label}
                          variant={selectedReasons.includes(item.name) ? 'contained' : 'outlined'}
                          color={selectedReasons.includes(item.name) ? 'text.primary' : 'default'}
                          sx={{borderColor:'black'}}
                          onClick={() => {
                            setSelectedReasons(prev =>
                              prev.includes(item.name)
                                ? prev.filter(r => r !== item.name)
                                : [...prev, item.name]
                            );
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )
              }
              {
                view === 'included' && (
                  <>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        flexWrap: 'wrap', 
                        gap: 1, 
                        pt:2,

                      }}
                    >
                      {[
                        { icon: <SafetyCheckIcon />, name:'check manually', label: 'Double-check' },
                        { icon: <SoapIcon sx={{ transform: 'translateY(-2px)' }} />, name:'clean version', label: 'Clean version' },
                        { icon: <FactCheckIcon />, name:'whitelist', label: 'Allowed word(s)' },  
                      ]
                      .filter(item => appearingReasons.has(item.name))
                      .map((item, index) => (
                        <Chip
                          key={index}
                          icon={item.icon}
                          label={item.label}
                          variant={selectedReasons.includes(item.name) ? 'contained' : 'outlined'}
                          color={selectedReasons.includes(item.name) ? 'text.primary' : 'default'}
                          sx={{borderColor:'black'}}
                          onClick={() => {
                            setSelectedReasons(prev =>
                              prev.includes(item.name)
                                ? prev.filter(r => r !== item.name)
                                : [...prev, item.name]
                            );
                          }}
                        />
                      ))}
                    </Box>
                  </>

                )
              }

        </Box>

          {/* Playlist View - Takes available space */}
          <Box sx={{ 
            flex: 1,
            minHeight: 0, 
            overflow: 'hidden',
            mb: 2
          }}>
            <PreviewPlaylist
              view={view}
              tracksList={JSON.parse(JSON.stringify(displayedTracks))}
              handleAddAnyway={handleIncludeAnyway}
              handleExclude={handleExcludeTrack}

            />
          </Box>

          {/* Snackbar - Song Included */}
           <Snackbar
            open={open}
            onClose={handleClose}
            message="Track included in playlist"
            action={view === 'included' ? undo('included') : undo('excluded')}
            sx={{ mx:'auto', maxWidth:'300px'}}
          />




          {/* Save Button - Fixed at bottom */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 'auto',
                mb: 2,
                flexShrink: 0
              }}
            >
           <Tooltip title={guestMode ? 'Log in with Spotify to save playlist' : ''}>
              <div>
                <Button
                  variant="contained"
                  sx={{ minWidth: '102px', borderRadius: '50px' }}
                  disabled={displayedTracks.length === 0 || guestMode}
                  loading={loading}
                  onClick={handleSave}
                >
                  Save to Library
                </Button>
              </div>
            </Tooltip>
            </Box>
        </Box>
      ) : (
        <Typography>I'm sorry, an issue has occured. Please try again.</Typography>
      )}
    </Box>
    </>
  );
}