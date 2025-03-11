import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Box,
  Paper,
  CircularProgress,
  SvgIcon,
  Tooltip
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import AlbumIcon from "@mui/icons-material/Album";
import spotifyApi from './spotifyApi'; 
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ExplicitIcon from '@mui/icons-material/Explicit';
import DiscFullIcon from '@mui/icons-material/DiscFull';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';

import ProfanityIcon from './ProfanityIcon';
import ViolenceIcon from './ViolenceIcon';




export default function PreviewPlaylist({ id, tracksList, view, handleAddAnyway }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [playlistLimitHit, setPlaylistLimitHit] = useState(false);
  const audioRef = useRef(new Audio());
  const scrollRef = useRef(null);



useEffect(() => {
  return () => {
    setTracks([]); // Cleanup tracks when component unmounts
    audioRef.current.pause(); // Stop any playing audio
    audioRef.current = new Audio(); // Reset audio element
  };
}, []);

  useEffect(() => {
    setLoading(true);

    const setTrackList = async () => {
      if (tracksList) {
        setTracks(tracksList);
        setLoading(false);
      } else if (id) {
        const playlistData = await getPlaylist(id);
        if (playlistData) {
          setTracks(playlistData.tracks);
          setLoading(false);
        }else{
          setLoading(false);
        }

      } else {
        setLoading(false);
      }
    };

     setTrackList();
  }, [id, tracksList]);

  useEffect(() =>{
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [view])

  const isValidTrack = (trackItem) => {
    const track = trackItem.track;
    if (!track) return false;
    if (!track.id || !track.name || !track.uri) return false;

    const album = track.album;
    if (!album || !album.id || !album.name || album.images.length === 0) return false;

    if (!track.artists || track.artists.length === 0 || !track.artists[0].id || !track.artists[0].name)
      return false;

    return true;
  };

  async function getPlaylist(playlistId) {
  
    let allTracks = [];
    let offset = 0;
    const limit = 100;
    let total = 0;
  
    try {
      do {
        const playlistData = await spotifyApi.getPlaylistTracks(playlistId, {
          offset,
          limit,
        });
  
        if (!playlistData || !playlistData.items) {
          return null;
        }
  
        const validTracks = playlistData.items
          .filter((item) => isValidTrack(item) )
          .map((item) => item.track);
  
        allTracks = [...allTracks, ...validTracks];
        offset += limit;
        total = playlistData.total;
  
      } while (offset < total);

        return {total: total, tracks: allTracks}
    } catch (error) {
      return null;
    }
  }
  

  const handlePlayPause = (track) => {
    if (playingTrackId === track.id) {
      audioRef.current.pause();
      setPlayingTrackId(null);
    } else {
      if (track.preview_url) {
        audioRef.current.src = track.preview_url;
        audioRef.current.play();
        setPlayingTrackId(track.id);
      } else {
        alert("Preview not available for this track.");
      }
    }
  };



  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
        No tracks available.
      </Typography>
    );
  }

  return (
    <Paper sx={{ 
      width: "100%", 
      height: "100%", // Use full height of container
      display: "flex", 
      flexDirection: "column",
      overflow: "hidden", 
      borderRadius: '15px', 
      backgroundColor: '#ebebeb' 
    }}>
      <TableContainer 
        ref={scrollRef}
        sx={{ 
          flex: 1, // Take up available space
          overflow: "auto",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Table aria-label="simple table"
          sx={{
            "& .MuiTableCell-root": {border: "none" },
            tableLayout: "fixed"
          }}
        >
          <TableHead sx={{ position: "sticky", top: 0, backgroundColor: '#ebebeb'}}>
            <TableRow>
              <TableCell sx={{width:"70%", p:'10px'}}>Title</TableCell>
              {view === "excluded" && (
                <>
                  <TableCell sx={{textAlign: "right", p:'10px'}}>Reason</TableCell>
                  <TableCell sx={{textAlign: "right", p:'10px'}}>Include</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
        </Table>
    
        <Box sx={{
          flexGrow: 1,
          maxHeight: "100%", // Subtract header height
          width: "100%",
          scrollbarColor: 'rgba(0, 0, 0, 0.5) rgba(0, 0, 0, 0)',
        }}>
          <Table
            sx={{
              "& .MuiTableCell-root": { padding: "10px", border: "none" },
              tableLayout: "fixed"
            }}
          >
            <TableBody>
              {tracks.map((track) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={track.id}>
                  {/* Tracks data */}
                  <TableCell sx={{width:"70%"}}>
                    <Box sx={{overflow:'hidden', display:'flex', gap:0.8}}>
                      <img
                        width="50px"
                        height="50px"
                        src={track.album.images[2].url || track.album.images[1].url || track.album.images[0].url}
                        alt={track.name}
                        style={{borderRadius: "2px"}}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 0.5,
                          maxWidth: "calc(100% - 60px)", // Subtract the width of the image + gap
                        }}
                      >
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          sx={{
                            lineHeight: 1.2,
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                          }}
                        >
                          {track.name}
                        </Typography>
                        <Box sx={{display:'flex', flexDirection:'row', gap:0.5, alignItems: 'flex-end'}}>
                          {track.explicit && <ExplicitIcon/>}
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.2}}
                          >
                            {track.artists[0].name}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
    
                  {/* Show reason only if the view is "excluded" */}
                  {view === "excluded" && (
                    <>
                      <TableCell align="right">
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          height: '100%'
                        }}>
                          {track.reason && track.reason.includes('Profanity') && (
                            <Tooltip title="Profanity"
                              enterTouchDelay={0} 
                              leaveTouchDelay={3000}
                            >
                              <span style={{marginLeft: '4px'}}><ProfanityIcon/></span>
                            </Tooltip>
                          )}
                          {track.reason && track.reason.includes('Violence') && (
                            <Tooltip title="Violence"
                              enterTouchDelay={0} 
                              leaveTouchDelay={3000}
                            >
                              <span style={{marginLeft: '4px'}}><ViolenceIcon/></span>
                            </Tooltip>
                          )}
                          {track.reason && track.reason.includes('Sexual') && (
                            <Tooltip 
                              title="Sexual Content"
                              enterTouchDelay={0} 
                              leaveTouchDelay={3000}
                            >
                              <span style={{marginLeft: '4px'}}><LocalFireDepartmentIcon/></span>
                            </Tooltip>
                          )}
                          {track.reason && track.reason.includes('No score') && (
                            <Tooltip title="Unable to verify"
                              enterTouchDelay={0} 
                              leaveTouchDelay={3000}
                            >
                              <span style={{marginLeft: '4px'}}><DiscFullIcon/></span>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          aria-label="add-anyway" 
                          size="small"
                          onClick={() => handleAddAnyway(track)}
                        >
                          <AddIcon />
                        </IconButton>
                      </TableCell>
                    </>
                  )}
                    
                  {(view === 'included' || view === 'preview') && 
                    <TableCell size="small" sx={{textAlign:'right'}}>
                      <IconButton
                        onClick={() => handlePlayPause(track)}
                        aria-label={playingTrackId === track.id ? "Pause" : "Play"}
                      >
                        {playingTrackId === track.id ? (
                          <PauseIcon />
                        ) : (
                          <PlayArrowIcon />
                        )}
                      </IconButton>
                    </TableCell>
                  }
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </TableContainer>
    </Paper>
  );
}
