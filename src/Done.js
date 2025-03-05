import * as React from 'react';
import {Container, Typography, Button} from '@mui/material';



// This component sends the status of Step 3 (Save / Done) to the App component.

export default function Done({savedPlaylist, originalPlaylistName}) {


//Prop - the playlist to clean from the App Component 

console.log("Done Comp: The Cleaned Playlist");
console.log(savedPlaylist);


  return (
    <Container sx={{ mt: 5 }}>

        <Typography variant="h6">{originalPlaylistName} has been cleanified!</Typography>
        <Typography variant="caption">Your cleaned playlist has been saved to your library.</Typography>

        <Container
           sx={{
             display: 'flex',
             flexDirection: 'row',
             justifyContent: 'start',
             my: 4,
             '& .MuiButtonBase-root': {
               borderRadius: '50px',
             },
             p:0,
             ml:-1
           }}
         >
           <Button 
           variant="contained" 
           sx={{ minWidth: '102px', minHeight:'42px', backgroundColor: 'secondary.main' }}
           onClick={() =>{
            console.log("Opening playlist in Spotify");
            window.open('https://open.spotify.com/playlist/' + savedPlaylist)
           }}
           
           >
            Open in Spotify
           </Button>
         </Container>

      
    </Container>
  );
}
