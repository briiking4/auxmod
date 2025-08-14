import * as React from 'react';
import { useState, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Search from './Search';
import Preview from './Preview';
import ReactGA from 'react-ga4';


export default function ChoosePlaylist({sendStatus, sendChosenPlaylist, guestMode}) {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: "Choose Playlist" });
}, []);

  const handleSearchSelect = (item) =>{
    setSelectedPlaylist({id: item.id, name: item.name, owner: item.owner.display_name, total: item.tracks.total})
    console.log(item)
    console.log("An Item Has been Selected from the Search Property, Ready for Preview/Confirm");
  }

  const handleStepStatus = (status) => {
    console.log("Step 1 complete: Recieved in Choose Playlist and sending status to App component");
    console.log(status);
    sendStatus(status);
    console.log("Sending the Chosen Playlist to the App Component");
    sendChosenPlaylist(selectedPlaylist);
    console.log(selectedPlaylist);
  };

  return (
    <Box sx={{ 
      flex: 1,
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      height: '100%'
    }}>
      
      {selectedPlaylist === null ? 
        <Search sendItemSelected={handleSearchSelect} guestMode={guestMode}/>
        :
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Back Button to Go back to Search */}
          <Box>
            <IconButton
              aria-label="back"
              size="large"
              sx={{justifyContent:'start', p:0, flexShrink: 0}}
              onClick={() => {
                setSelectedPlaylist(null);
              }}
            >
              <ArrowBackIcon sx={{ p: 0, mb: 1}} fontSize="inherit" />
            </IconButton>
          </Box>

          {/* Preview the playlist that was selected. (Preview comp takes the emaining height) */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Preview sendStatus={handleStepStatus} item={selectedPlaylist}/>
          </Box>
        </Box>
      }
    </Box>
  );
}