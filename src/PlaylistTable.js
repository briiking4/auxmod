import React, { useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ExplicitIcon from "@mui/icons-material/Explicit";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import MusicOffIcon from "@mui/icons-material/MusicOff";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ErrorIcon from "@mui/icons-material/Error";
import BlockIcon from "@mui/icons-material/Block";
import SoapIcon from "@mui/icons-material/Soap";
import VerifiedIcon from "@mui/icons-material/Verified";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ProfanityIcon from './ProfanityIcon';
import ViolenceIcon from './ViolenceIcon';
import SafetyCheckIcon from '@mui/icons-material/SafetyCheck';
import HealingIcon from '@mui/icons-material/Healing';

import { OpenInFull, CloseFullscreen } from '@mui/icons-material';


export default function PlaylistTable({
  tracks,
  view,
  playingTrackId,
  handlePlayPause,
  handleAddAnyway,
  handleExclude,
  onEnlarge,
  isEnlarged
}) {
  const scrollRef = useRef(null);


  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
  }, [view]);

  const redactWord = (word) => {
    if (word.length <= 2) return '*'.repeat(word.length);
    return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
  };

  if (!tracks || tracks.length === 0) {
    if (view === 'preview' || view === 'reason_filter') return <Typography align="center">No tracks available.</Typography>;
    if (view === 'excluded') return <Typography align="center">All tracks passed the filters!</Typography>;
    if (view === 'included') return <Typography align="center">No tracks passed the filters.</Typography>;
  }

  

  return (
    <Paper
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: '15px',
        backgroundColor: '#ebebeb'
      }}
    >

      <TableContainer
        ref={scrollRef}
        sx={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          backgroundColor: '#ebebeb',
        }}
      >
        <Table
          aria-label="playlist table"
          sx={{
            "& .MuiTableCell-root": { border: "none" },
            tableLayout: "fixed",
          }}
        >
          <TableHead sx={{ position: "sticky", top: 0, backgroundColor: '#ebebeb' }}>
            <TableRow>
              <TableCell sx={{ p: '10px' }}>Title</TableCell>
              {(view === "excluded" || view === "included") && (
                <>
                  <TableCell sx={{ textAlign: view === "included" ? 'center' : 'left', p: '10px', width: '25%' }}>
                    Reason
                  </TableCell>
                  <TableCell sx={{ textAlign: "center", p: '10px', width: '20%' }}>
                    {view === "included" ? "Remove" : "Add Back"}
                  </TableCell>
                </>
              )}
              <TableCell sx={{width:'20px'}}>
                <Tooltip title={isEnlarged ? "Exit Fullscreen" : "View Fullscreen"}>
                    <IconButton
                        onClick={onEnlarge}
                        sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        zIndex: 5,
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                        }}
                    >
                        {isEnlarged ? (
                        <CloseFullscreen fontSize="small" />
                        ) : (
                        <OpenInFull fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tracks.map((track) => (
              <TableRow hover role="checkbox" tabIndex={-1} key={track.id}>
                <TableCell sx={{pl:0}}>
                  <Box sx={{ display: 'flex', gap: 0.8 }}>
                    <IconButton
                      onClick={() => handlePlayPause(track)}
                      aria-label={playingTrackId === track.id ? "Pause" : "Play"}
                    >
                      {playingTrackId === track.id ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>

                    <img
                      width="50px"
                      height="50px"
                      src={track.album.images[2]?.url || track.album.images[1]?.url || track.album.images[0]?.url}
                      alt={track.name}
                      style={{ borderRadius: "2px" }}
                    />

                    <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {track.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {track.explicit && <ExplicitIcon />}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {track.artists[0].name}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </TableCell>

                {(view === "excluded" || view === "included") && (
                  <>
                    <TableCell align="right" sx={{ width: '25%' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: view === "included" ? 'center' : 'flex-start',
                          alignItems: 'center',
                        }}
                      >
                        {/* Render icons based on reason */}
                        {track.reason && track.reason.includes('Profanity') && (
                          <>
                            {track.trackAnalysis.profanity?.blacklistedWordsFound?.length > 0 && (
                              <Tooltip
                                title={`Profanity: ${track.trackAnalysis.profanity.blacklistedWordsFound
                                  .map(redactWord)
                                  .join(', ')}`}
                              >
                                <span><ProfanityIcon /></span>
                              </Tooltip>
                            )}
                            {track.trackAnalysis.profanity?.customBlacklistedWordsFound?.length > 0 && (
                              <Tooltip
                                title={`Blocked word: ${track.trackAnalysis.profanity.customBlacklistedWordsFound.join(', ')}`}
                              >
                                <span><BlockIcon /></span>
                              </Tooltip>
                            )}
                          </>
                        )}
                        {track.reason?.includes('Violence') && (
                          <Tooltip title="Violence"><span><ViolenceIcon /></span></Tooltip>
                        )}
                        {track.reason?.includes('Sexual') && (
                          <Tooltip title="Sexual Content"><span><LocalFireDepartmentIcon /></span></Tooltip>
                        )}
                        {track.reason?.includes('Self-Harm') && (
                          <Tooltip title="Self-Harm"><span><HealingIcon /></span></Tooltip>
                        )}
                        {track.reason?.includes('No score') && (
                          <Tooltip title="Lyrics unavailable"><span><MusicOffIcon /></span></Tooltip>
                        )}
                        {track.reason?.includes('failed') && (
                          <Tooltip title="Error"><span><ErrorIcon /></span></Tooltip>
                        )}
                        {track.reason?.includes('clean version') && (
                          <Tooltip title="Clean version found"><span><SoapIcon /></span></Tooltip>
                        )}
                        {track.reason?.includes('passed filters') &&
                          (track.trackAnalysis.profanity?.whitelistedWordsFound?.length || 0) === 0 && (
                            <Tooltip title="Passed selected filters"><span><VerifiedIcon /></span></Tooltip>
                          )}
                        {track.trackAnalysis?.profanity?.whitelistedWordsFound?.length > 0 &&
                          track.reason?.includes('passed filters') && (
                            <Tooltip
                              title={`Contains allowed words: ${track.trackAnalysis.profanity.whitelistedWordsFound.join(', ')}`}
                            >
                              <span><FactCheckIcon /></span>
                            </Tooltip>
                          )}
                        {track.reason?.includes('check manually') && (
                          <Tooltip title="Verify"><span><SafetyCheckIcon/></span></Tooltip>
                        )}

                      </Box>
                    </TableCell>

                    <TableCell align="center" sx={{ width: '20%' }}>
                      {view === "excluded" && (
                        <IconButton onClick={() => handleAddAnyway(track)}><AddIcon /></IconButton>
                      )}
                      {view === "included" && (
                        <IconButton onClick={() => handleExclude(track)}><RemoveIcon /></IconButton>
                      )}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
