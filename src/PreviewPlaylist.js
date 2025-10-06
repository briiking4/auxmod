import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog
} from "@mui/material";
// import { OpenInFull, Close } from "@mui/icons-material";
import spotifyApi from './spotifyApi';
import PlaylistTable from './PlaylistTable';

export default function PreviewPlaylist({ id, tracksList, view, handleAddAnyway, handleExclude }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [enlarged, setEnlarged] = useState(false);
  const audioRef = useRef(new Audio());
  

  useEffect(() => {
    return () => {
      audioRef.current.pause();
      audioRef.current = new Audio();
    };
  }, []);

  useEffect(() => {
    const loadTracks = async () => {
      setLoading(true);
      if (tracksList) {
        setTracks(tracksList);
      } else if (id) {
        const playlistData = await getPlaylist(id);
        if (playlistData) setTracks(playlistData.tracks);
      }
      setLoading(false);
    };
    loadTracks();
  }, [id, tracksList]);

  const getPlaylist = async (playlistId) => {
    try {
      const res = await spotifyApi.getPlaylistTracks(playlistId, { limit: 100 });
      return { tracks: res.items.map(i => i.track) };
    } catch {
      return null;
    }
  };

  const handlePlayPause = (track) => {
    if (playingTrackId === track.id) {
      audioRef.current.pause();
      setPlayingTrackId(null);
    } else if (track.preview_url) {
      audioRef.current.src = track.preview_url;
      audioRef.current.play();
      setPlayingTrackId(track.id);
    } else {
      alert("Preview not available for this track.");
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress /></Box>;
  }

  const toggleEnlarged = () => setEnlarged(prev => !prev);


  return (
    <>

      <PlaylistTable
        tracks={tracks}
        view={view}
        playingTrackId={playingTrackId}
        handlePlayPause={handlePlayPause}
        handleAddAnyway={handleAddAnyway}
        handleExclude={handleExclude}
        onEnlarge={toggleEnlarged} 
        isEnlarged={enlarged}
      />

      <Dialog fullScreen open={enlarged} onClose={toggleEnlarged} >

        <Box sx={{ p: 2 }}>
          <PlaylistTable
            tracks={tracks}
            view={view}
            playingTrackId={playingTrackId}
            handlePlayPause={handlePlayPause}
            handleAddAnyway={handleAddAnyway}
            handleExclude={handleExclude}
            onEnlarge={toggleEnlarged} 
            isEnlarged={enlarged}
          />
        </Box>
      </Dialog>
    </>
  );
}
