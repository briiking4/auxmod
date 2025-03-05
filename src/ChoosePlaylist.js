import * as React from 'react';
import { useState } from 'react';
import {Container, IconButton, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Search from './Search';
import Preview from './Preview';


// This component sends the status of Step 1 (Choose Playlist) to the App component. The App component will then share this information with the Step Toggle Component.

export default function ChoosePlaylist({sendStatus, sendChosenPlaylist}) {

// Getting the playlist that was selected from the Search Component. The Search Component gets that item that was selected from ListItems. 

  const [selectedPlaylist, setSelectedPlaylist] = useState(null);


  const handleSearchSelect = (item) =>{
    setSelectedPlaylist({id: item.id, name: item.name, owner: item.owner.display_name, total: item.tracks.total})
    console.log(item)
    console.log("An Item Has been Selected from the Search Property, Ready for Preview/Confirm");
  }

// Getting the status of whether or not the user confirmed their selection from the Preview component and sending it to the App Component.

  const handleStepStatus = (status) => {
    console.log("Step 1 complete: Recieved in Choose Playlist and sending status to App component");
    console.log(status);
    sendStatus(status);
    console.log("Sending the Chosen Playlist to the App Component");
    sendChosenPlaylist(selectedPlaylist);
    console.log(selectedPlaylist);
  };

  return (
    <Container sx={{ mt: 4, p:0 }}>
      
      {
        selectedPlaylist === null ? 
            <Search sendItemSelected={handleSearchSelect}/>
        :
        <Box sx={{mt:-3, p:0}}>
              {/* Back Button to Go back to Search */}
            <IconButton
            aria-label="back"
            size="large"
            onClick={() => {
                setSelectedPlaylist(null);
            }}
            >
                <ArrowBackIcon sx={{ p: 0, mb: 1 }} fontSize="inherit" />
            </IconButton>

            <Preview sendStatus={handleStepStatus} item={selectedPlaylist}/>
        </Box>
      }
      
    </Container>
  );
}
