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
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
          {
            item != null &&
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
            }}> 

              {/* Header section */}
              <Box sx={{mb:2, flexShrink: 0}}>
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

              {/* Playlist takes available space and can scroll */}
              <Box sx={{ 
                flex: 1, 
                minHeight: 0, 
                overflow: 'hidden',
                mb: 2,
              }}>
                <PreviewPlaylist id={item.id} tracksList={null} view="preview" />
              </Box>

              {/* Button container pinned to bottom */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 'auto',
                  mb: 1,
                }}
              >
                <Button 
                  variant="contained" 
                  sx={{ 
                    minWidth: '102px',
                    borderRadius: '50px',
                  }}
                  onClick={() => {
                    handleConfirm()
                  }}
                  disabled={!tracksAvalible || playlistLimitHit}
                >
                  Confirm    
                </Button> 
              </Box>

              {/* Messages section */}
              <Box sx={{ flexShrink: 0, textAlign: 'center' }}>
                {playlistLimitHit && 
                  <Typography variant="subtitle2">
                    Playlist is too large. Please select a playlist with 200 tracks or less.
                  </Typography>
                }
                {!tracksAvalible &&
                  <Typography variant="subtitle2">
                    This playlist is empty or contains unavalible tracks.
                  </Typography>
                }
              </Box>
            </Box>
          }
    </Box>
  );
}