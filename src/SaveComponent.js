import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button, Box, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PreviewPlaylist from './PreviewPlaylist';
import spotifyApi from './spotifyApi';
import ProfanityIcon from './ProfanityIcon';
import ViolenceIcon from './ViolenceIcon';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DiscFullIcon from '@mui/icons-material/DiscFull';
import ReactGA from 'react-ga4';




export default function SaveComponent({ sendStatus, cleanedPlaylist, chosenFilters, userId, sendSavedPlaylist }) {
  const [view, setView] = useState('included');
  const [loading, setLoading] = useState(false);

   // Google Analytics tracking:

   useEffect(() => {
      ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: "Review & Save Playlist" });
  }, []);


  const displayedTracks =
    view === 'included'
      ? cleanedPlaylist?.tracksAdded || []
      : cleanedPlaylist?.excludedTracks || [];

  const sendStepStatus = (state) => {
    console.log("Step 3 complete: Sending status:", state);
    sendStatus(state);
  };

  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  
  async function CreateCleanedPlaylist(playlist) {
    const newPlaylist = await spotifyApi.createPlaylist(userId, {
      name: `${playlist.name}`,
      description: `Clean version of ${playlist.name} without ${formatter.format(chosenFilters)} content. Filtered using Cleanify.`,
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
    await CreateCleanedPlaylist(cleanedPlaylist);
    sendStepStatus(true);
  };

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
      </Box>

      {cleanedPlaylist ? (
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
                      ? 'Failed filter(s)'
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
                      gap: 2, 
                      px: 2
                    }}
                  >
                    {[
                      { icon: <ProfanityIcon />, label: 'Profanity' },
                      { icon: <ViolenceIcon />, label: 'Violence' },
                      { icon: <LocalFireDepartmentIcon />, label: 'Sexual' },
                    ]
                    .filter(item => chosenFilters.includes(item.label)) // Show only chosen filters
                    .concat({ icon: <DiscFullIcon />, label: 'Unable to verify' }) // Always include this
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
            />
          </Box>

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