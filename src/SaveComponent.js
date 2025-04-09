import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button, Box, Typography, IconButton, Snackbar} from '@mui/material';
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


import SoapIcon from '@mui/icons-material/Soap';
import VerifiedIcon from '@mui/icons-material/Verified';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import ReactGA from 'react-ga4';


export default function SaveComponent({ sendStatus, cleanedPlaylist, chosenFilters, userId, sendSavedPlaylist }) {
  const [view, setView] = useState('included');
  const [loading, setLoading] = useState(false);
  const [localCleanedPlaylist, setLocalCleanedPlaylist] = useState(cleanedPlaylist)
  const [open, setOpen] = React.useState(false);
  const [includeTrack, setIncludeTrack] = useState(null)
  const [excludeTrack, setExcludeTrack] = useState(null)
  const [originalIndexIncluded, setOriginalIndexIncluded] = useState(null);
  const [originalIndexExcluded, setOriginalIndexExcluded] = useState(null);

   // Google Analytics tracking:

   useEffect(() => {
      ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: "Review & Save Playlist" });
      setLocalCleanedPlaylist(cleanedPlaylist);
  }, []);

  const displayedTracks =
    view === 'included'
      ? localCleanedPlaylist?.tracksAdded || []
      : localCleanedPlaylist?.excludedTracks || [];

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
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header Section */}
      <Box sx={{ flexShrink: 0 }}>
        {/* Back Button */}
        <IconButton
          aria-label="back"
          size="large"
          onClick={() => sendStepStatus(false)}
          sx={{ p: 0, mb: 1 }}
        >
          <ArrowBackIcon fontSize="inherit" />
        </IconButton>

        <Typography variant="h6">{cleanedPlaylist?.name}</Typography>
        <Typography variant="caption">Filters: {chosenFilters.join(', ')}</Typography>

      </Box>

      {localCleanedPlaylist ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          mt:2
        }}>
          {/* Toggle Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              mb: 2,
              flexShrink: 0,
              mx:'auto',
              gap:'40px',
            }}
          >
            <Button
              sx={{
                minWidth: '102px',
                borderRadius: '50px',
                backgroundColor: view === 'included' ? 'secondary.main' : 'secondary.light',
                color: 'text.primary'
              }}
              onClick={() => setView('included')}
            >
              Included Tracks
            </Button>
            <Button
              sx={{
                minWidth: '102px',
                borderRadius: '50px',
                backgroundColor: view === 'excluded' ? 'secondary.main' : 'secondary.light',
                color: 'text.primary'
              }}
              onClick={() => setView('excluded')}
            >
              Excluded Tracks
            </Button>
          </Box>

            {/* Filter Message */}
            <Box sx={{ mb: 2, flexShrink: 0, textAlign:'center'}}>
              <Typography variant="caption">
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
              </Typography>
              {/* Table Reason Ledgend */}
              {
                view === 'excluded' && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      flexWrap: 'wrap', 
                      gap: 1, 
                      px: 2
                    }}
                  >
                    {[
                      { icon: <ProfanityIcon />, label: 'Profanity' },
                      { icon: <ViolenceIcon />, label: 'Violence' },
                      { icon: <LocalFireDepartmentIcon />, label: 'Sexual' },
                    ]
                    .filter(item => chosenFilters.includes(item.label)) // Show only chosen filters
                    .concat([{ icon: <MusicOffIcon />, label: 'No lyrics' },{ icon: <ErrorIcon />, label: 'Error' } ]) // Always include this
                    .map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size="small" disabled>
                          {item.icon}
                        </IconButton>
                        <Typography variant="caption">{item.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                )
              }
              {
                view === 'included' && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      flexWrap: 'wrap', 
                      gap: 1, 
                      px: 2
                    }}
                  >
                    {[
                      { icon: <VerifiedIcon />, label: 'Passed filters' },
                      { icon: <SoapIcon sx={{ transform: 'translateY(-2px)' }} />, label: 'Clean version' },
                      { icon: <FactCheckIcon />, label: 'Has allowed word(s)' },
                    ]
                    .map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size="small" disabled>
                          {item.icon}
                        </IconButton>
                        <Typography variant="caption">{item.label}</Typography>
                      </Box>
                    ))}
                  </Box>
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
          {view === 'included' && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 'auto',
                mb: 2,
                flexShrink: 0
              }}
            >
              <Button
                variant="contained"
                sx={{ minWidth: '102px', borderRadius: '50px' }}
                disabled={displayedTracks.length === 0}
                loading={loading}
                onClick={handleSave}
              >
                Save to Library
              </Button>
            </Box>
          )}
        </Box>
      ) : (
        <Typography>I'm sorry, an issue has occured. Please try again.</Typography>
      )}
    </Box>
  );
}