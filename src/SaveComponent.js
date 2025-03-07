import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button, Box, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PreviewPlaylist from './PreviewPlaylist';
import spotifyApi from './spotifyApi';

export default function SaveComponent({ sendStatus, cleanedPlaylist, chosenFilters, userId, sendSavedPlaylist }) {
  const [view, setView] = useState('included');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("Save Compt has mounted and the cleanedplaylist is", cleanedPlaylist);
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
        <Typography variant="caption">
          Filters: {chosenFilters?.join(', ')}
        </Typography>
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

          {/* Track Info Message */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Typography variant="caption">
              {view === 'included'
                ? displayedTracks.length > 0
                  ? 'Passed filter(s) or found a clean replacement'
                  : 'No tracks passed the filter(s) and no clean version replacement was found.'
                : displayedTracks.length > 0
                  ? 'Failed filter(s), lacks a valid clean version replacement, or unable to proccess'
                  : 'All tracks either passed filter(s) or a clean version replacement was found!'}
            </Typography>
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