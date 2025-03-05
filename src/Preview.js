import * as React from 'react';
import { useState, useEffect } from 'react';
import {Container, Button, Typography, Box} from '@mui/material';
import PreviewPlaylist from './PreviewPlaylist';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';


export default function Preview({sendStatus, item}) {

    const [confirm, setConfirm] = useState(false);
    const [save, setSave] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);
    const [tracksAvalible, setTracksAvalible] = useState(false)
    const [playlistLimitHit, setPlaylistLimitHit] =useState(false)

    console.log(item)

    useEffect(() => {
      console.log("PLaylist Data recieved in Preview from Choose Playlist", item)
      if(item.total > 200){
        setPlaylistLimitHit(true)
      }
      if(item.total > 0){
        setTracksAvalible(true);
      }
    }, [item])


    //sending step status to Choose Playlist
    const handleConfirm = () =>{
        sendStatus([0,true]);
    }   
    

  return (
         <Container sx={{p: 0 }}>
          {
            item != null &&
            <Box> 

              <Box sx={{mb:2}}>

                <Typography variant="h6">
                    {item.name}
                </Typography>

                <Box sx={{display:'flex', flexDirection:'row', alignItems:'center'}}>
                  <Typography variant="caption">
                    {item.owner}
                  </Typography>

                  <FiberManualRecordIcon sx={{fontSize:'10px', mx:1}}/>

                  <Typography variant="caption">
                    {item.total + " songs"}
                  </Typography>
                </Box>
              </Box>

                  <PreviewPlaylist id={item.id} tracksList={null} view="preview"/>
                  <Container
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent:'center',
                    textAlign: 'center',
                    mt: 2,
                    '& .MuiButtonBase-root': {
                      borderRadius: '50px',
                    },
                    width: '80%'
                  }}
                  >
                    <Button 
                    variant="contained" 
                    sx={{ minWidth: '102px' }}
                    onClick={() =>{
                          handleConfirm()
                    }}
                    disabled={!tracksAvalible || playlistLimitHit}
                    
                    >
                      Confirm    
                    </Button> 

                {
                  playlistLimitHit && 
                  <Typography variant="subtitle2">
                    Playlist is too large. Please select a playlist with 200 tracks or less.
                  </Typography>
                }
                {
                  !tracksAvalible &&
                  <Typography variant="subtitle2">
                    This playlist is empty or contains unavalible tracks.
                  </Typography>
                }
                  </Container>   
            </Box>
          }

       </Container>
  );
}

       
       
       
       
       
  