import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button, Container, Box, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PreviewPlaylist from './PreviewPlaylist';
import spotifyApi from './spotifyApi';

export default function SaveComponent({ sendStatus, cleanedPlaylist, chosenFilters, userId, sendSavedPlaylist }) {
  const [view, setView] = useState('included');
  const [loading, setLoading] = useState(false);

  useEffect(() =>{
    console.log("Save Compt has mounted and the cleanedplaylist is", cleanedPlaylist)
  },[])


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
    <Container sx={{ p: 0 }}>
      <Container sx={{ p: 0, mt: -3 }}>
        {/* Back Button */}
        <IconButton
          aria-label="back"
          size="large"
          onClick={() => sendStepStatus(false)}
          sx={{ p: 0, mb: 1}}
        >
          <ArrowBackIcon sx={{ p: 0 }} fontSize="inherit" />
        </IconButton>
      </Container>

      <Typography variant="h6">{cleanedPlaylist?.name}</Typography>
      <Typography variant="caption">
        Filters: {chosenFilters?.join(', ')}
      </Typography>

      {cleanedPlaylist ? (
        <>
          <Container
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              mt: 2,
              '& .MuiButtonBase-root': { borderRadius: '50px' },
              p: 0,
              maxWidth:'400px'
            }}
          >
            <Button
              sx={{ minWidth: '102px',
              backgroundColor: view === 'included' ? 'secondary.main' : 'secondary.light',
              color:'text.primary'
             }}
              onClick={() => setView('included')}
            >
              Included Tracks
            </Button>
            <Button
              sx={{ minWidth: '102px',
              backgroundColor: view === 'excluded' ? 'secondary.main' : 'secondary.light',
              color:'text.primary'
             }}
              onClick={() => setView('excluded')}
            >
              Excluded Tracks
            </Button>
          </Container>

          <Box sx={{ mt: 2, p: 0}}>
            <Box sx={{mb:2}}>
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

            <PreviewPlaylist
              view={view}
              tracksList={JSON.parse(JSON.stringify(displayedTracks))}
              />
          </Box>

          {view === 'included' && (
            <Container
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                mt: 2,
                '& .MuiButtonBase-root': { borderRadius: '50px' },
                p: 0,
              }}
            >
              <Button
                variant="contained"
                sx={{ minWidth: '102px' }}
                disabled={displayedTracks.length === 0}
                loading={loading}
                onClick={handleSave}
              >
                Save to Library
              </Button>
            </Container>
          )}
        </>
      ) : (
        <Typography>I'm sorry, an issue has occured. Please try again.</Typography>
      )}
    </Container>
  );
}
