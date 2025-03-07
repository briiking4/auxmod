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



export default function PreviewPlaylist({ id, tracksList, view }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [playlistLimitHit, setPlaylistLimitHit] = useState(false);
  const audioRef = useRef(new Audio());


  const violenceIcon = <SvgIcon style={{ transform: 'translateX(5px)' }} xmlns="http://www.w3.org/2000/svg" fill="red" viewBox="0 0 700 600" ><path d="M368 128c0 44.4-25.4 83.5-64 106.4V256c0 17.7-14.3 32-32 32H176c-17.7 0-32-14.3-32-32V234.4c-38.6-23-64-62.1-64-106.4C80 57.3 144.5 0 224 0s144 57.3 144 128zM168 176a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm144-32a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM3.4 273.7c7.9-15.8 27.1-22.2 42.9-14.3L224 348.2l177.7-88.8c15.8-7.9 35-1.5 42.9 14.3s1.5 35-14.3 42.9L295.6 384l134.8 67.4c15.8 7.9 22.2 27.1 14.3 42.9s-27.1 22.2-42.9 14.3L224 419.8 46.3 508.6c-15.8 7.9-35 1.5-42.9-14.3s-1.5-35 14.3-42.9L152.4 384 17.7 316.6C1.9 308.7-4.5 289.5 3.4 273.7z"/></SvgIcon>;      
  const profanityIcon = 
    <SvgIcon  viewBox="0 0 800 800" fill="black" xmlns="http://www.w3.org/2000/svg">
      <path d="M303.112 207.482C344.903 196.827 388.792 197.62 430.17 209.777C433.349 210.719 436.772 210.36 439.686 208.778C442.6 207.196 444.767 204.522 445.709 201.342C446.651 198.163 446.291 194.74 444.709 191.826C443.128 188.912 440.453 186.746 437.274 185.804C391.553 172.381 343.064 171.504 296.887 183.264C293.676 184.089 290.924 186.157 289.236 189.011C287.549 191.866 287.065 195.274 287.891 198.486C288.716 201.697 290.784 204.449 293.638 206.137C296.493 207.824 299.901 208.308 303.112 207.482Z"/>
      <path d="M450 425C463.807 425 475 413.807 475 400C475 386.193 463.807 375 450 375C436.193 375 425 386.193 425 400C425 413.807 436.193 425 450 425Z"/>
      <path d="M275 425C288.807 425 300 413.807 300 400C300 386.193 288.807 375 275 375C261.193 375 250 386.193 250 400C250 413.807 261.193 425 275 425Z"/>
      <path d="M305.742 371.915C306.282 371.974 306.825 372.002 307.368 372C310.848 371.997 314.194 370.782 316.723 368.604C319.253 366.427 320.774 363.451 320.977 360.285C321.179 357.119 320.048 354.002 317.813 351.571C315.578 349.14 312.409 347.579 308.954 347.207C308.467 347.159 260.412 341.315 248.093 316.339C246.609 313.33 243.875 310.982 240.491 309.81C237.108 308.639 233.352 308.741 230.051 310.094C226.75 311.446 224.174 313.939 222.889 317.023C221.604 320.107 221.716 323.53 223.2 326.539C241.982 364.627 303.15 371.635 305.742 371.915Z"/>
      <path d="M405.31 361.365C405.673 364.397 407.133 367.192 409.416 369.221C411.699 371.249 414.646 372.371 417.7 372.375C418.196 372.377 418.691 372.348 419.184 372.29C421.559 372.009 477.594 364.966 494.794 326.696C496.153 323.672 496.255 320.232 495.078 317.133C493.901 314.034 491.541 311.529 488.518 310.17C485.494 308.811 482.054 308.708 478.955 309.885C475.855 311.062 473.351 313.422 471.991 316.446C462.543 337.467 428.528 345.964 416.224 347.465C412.936 347.867 409.941 349.555 407.896 352.161C405.85 354.766 404.921 358.076 405.31 361.365Z"/>
      <path d="M179.662 575H202.475L207.837 562.5H185.025L179.662 575Z"/>
      <path d="M362.5 137.5C318.248 137.509 274.546 147.306 234.525 166.188C194.504 185.071 159.154 212.572 131.01 246.72C102.865 280.868 82.6217 320.819 71.7303 363.71C60.8388 406.601 59.5688 451.37 68.0112 494.809C64.4242 502.248 62.5415 510.394 62.5 518.652V618.848C62.5175 633.735 68.4392 648.007 78.9661 658.534C89.4929 669.061 103.765 674.982 118.653 675H179.42C179.6 675.156 179.685 675.375 179.876 675.525C232.273 715.717 296.465 737.501 362.501 737.501C428.538 737.501 492.73 715.717 545.126 675.525C545.318 675.379 545.403 675.156 545.583 675H593.85C608.737 674.982 623.009 669.06 633.535 658.533C644.061 648.006 649.982 633.734 650 618.848V523.389C663.346 478.602 666.05 431.318 657.897 385.302C649.744 339.286 630.959 295.809 603.039 258.333C575.118 220.858 538.834 190.42 497.074 169.442C455.314 148.464 409.233 137.526 362.5 137.5ZM211.486 617.42C210.526 619.67 208.925 621.589 206.882 622.936C204.84 624.284 202.447 625.002 200 625C198.308 625.003 196.634 624.658 195.081 623.986C192.037 622.68 189.635 620.217 188.405 617.141C187.175 614.065 187.216 610.626 188.52 607.58L191.77 600H168.952L161.486 617.42C160.526 619.67 158.925 621.589 156.882 622.936C154.84 624.284 152.447 625.002 150 625C148.308 625.003 146.634 624.658 145.081 623.986C142.037 622.68 139.635 620.217 138.405 617.141C137.175 614.065 137.216 610.626 138.52 607.58L141.77 600H137.5C134.185 600 131.005 598.683 128.661 596.339C126.317 593.995 125 590.815 125 587.5C125 584.185 126.317 581.005 128.661 578.661C131.005 576.317 134.185 575 137.5 575H152.476L157.833 562.5H150C146.685 562.5 143.505 561.183 141.161 558.839C138.817 556.495 137.5 553.315 137.5 550C137.5 546.685 138.817 543.505 141.161 541.161C143.505 538.817 146.685 537.5 150 537.5H168.547L176.014 520.08C176.63 518.529 177.551 517.116 178.722 515.927C179.893 514.737 181.291 513.794 182.832 513.153C184.374 512.512 186.028 512.187 187.698 512.196C189.367 512.205 191.018 512.548 192.552 513.205C194.087 513.863 195.474 514.821 196.632 516.023C197.791 517.225 198.696 518.647 199.296 520.205C199.896 521.763 200.177 523.425 200.124 525.094C200.071 526.762 199.684 528.403 198.986 529.92L195.736 537.5H218.545L226.011 520.08C226.628 518.529 227.549 517.116 228.72 515.927C229.891 514.737 231.288 513.794 232.83 513.153C234.371 512.512 236.026 512.187 237.695 512.196C239.364 512.205 241.015 512.548 242.55 513.205C244.084 513.863 245.472 514.821 246.63 516.023C247.788 517.225 248.694 518.647 249.293 520.205C249.893 521.763 250.175 523.425 250.122 525.094C250.068 526.762 249.681 528.403 248.984 529.92L245.734 537.5H250C253.315 537.5 256.495 538.817 258.839 541.161C261.183 543.505 262.5 546.685 262.5 550C262.5 553.315 261.183 556.495 258.839 558.839C256.495 561.183 253.315 562.5 250 562.5H235.024L229.667 575H237.5C240.815 575 243.995 576.317 246.339 578.661C248.683 581.005 250 584.185 250 587.5C250 590.815 248.683 593.995 246.339 596.339C243.995 598.683 240.815 600 237.5 600H218.952L211.486 617.42ZM362.5 712.5C313.869 712.583 266.103 699.634 224.172 675H500.829C458.898 699.634 411.132 712.583 362.5 712.5ZM365.399 529.493C366.45 528.232 367.74 527.19 369.194 526.428C370.648 525.665 372.238 525.197 373.873 525.049C375.508 524.901 377.156 525.076 378.724 525.565C380.291 526.054 381.747 526.847 383.007 527.899C384.268 528.95 385.31 530.24 386.072 531.694C386.835 533.148 387.303 534.738 387.451 536.373C387.599 538.008 387.424 539.656 386.935 541.224C386.446 542.791 385.653 544.247 384.601 545.507L322.101 620.507C321.05 621.768 319.76 622.81 318.306 623.572C316.852 624.335 315.262 624.803 313.627 624.951C311.992 625.099 310.344 624.924 308.776 624.435C307.209 623.946 305.753 623.153 304.492 622.101C303.232 621.05 302.19 619.76 301.428 618.306C300.665 616.852 300.197 615.262 300.049 613.627C299.901 611.992 300.076 610.344 300.565 608.776C301.054 607.209 301.847 605.753 302.899 604.493L365.399 529.493ZM312.5 537.5C312.5 535.028 313.233 532.611 314.607 530.555C315.98 528.5 317.932 526.898 320.216 525.952C322.501 525.005 325.014 524.758 327.439 525.24C329.863 525.722 332.091 526.913 333.839 528.661C335.587 530.409 336.777 532.637 337.26 535.061C337.742 537.486 337.495 539.999 336.548 542.284C335.602 544.568 334 546.52 331.945 547.893C329.889 549.267 327.472 550 325 550C321.685 550 318.505 548.683 316.161 546.339C313.817 543.995 312.5 540.815 312.5 537.5ZM375 612.5C375 614.972 374.267 617.389 372.893 619.445C371.52 621.5 369.568 623.102 367.284 624.048C364.999 624.995 362.486 625.242 360.061 624.76C357.637 624.278 355.409 623.087 353.661 621.339C351.913 619.591 350.722 617.363 350.24 614.939C349.758 612.514 350.005 610.001 350.952 607.716C351.898 605.432 353.5 603.48 355.555 602.107C357.611 600.733 360.028 600 362.5 600C365.815 600 368.995 601.317 371.339 603.661C373.683 606.005 375 609.185 375 612.5ZM450 612.5C452.472 612.5 454.889 613.233 456.945 614.607C459 615.98 460.602 617.932 461.548 620.216C462.495 622.501 462.742 625.014 462.26 627.439C461.777 629.863 460.587 632.091 458.839 633.839C457.091 635.587 454.863 636.778 452.439 637.26C450.014 637.742 447.501 637.495 445.216 636.548C442.932 635.602 440.98 634 439.607 631.945C438.233 629.889 437.5 627.472 437.5 625C437.5 621.685 438.817 618.505 441.161 616.161C443.505 613.817 446.685 612.5 450 612.5ZM437.5 587.5V512.5C437.5 509.185 438.817 506.005 441.161 503.661C443.505 501.317 446.685 500 450 500C453.315 500 456.495 501.317 458.839 503.661C461.183 506.005 462.5 509.185 462.5 512.5V587.5C462.5 590.815 461.183 593.995 458.839 596.339C456.495 598.683 453.315 600 450 600C446.685 600 443.505 598.683 441.161 596.339C438.817 593.995 437.5 590.815 437.5 587.5ZM578.955 574.353L556.975 581.68L572.9 605.566C573.829 606.932 574.477 608.467 574.809 610.085C575.14 611.702 575.148 613.37 574.832 614.99C574.516 616.611 573.881 618.153 572.966 619.527C572.05 620.901 570.871 622.08 569.498 622.996C568.124 623.912 566.582 624.546 564.962 624.863C563.341 625.18 561.674 625.172 560.056 624.841C558.439 624.51 556.903 623.862 555.537 622.934C554.172 622.005 553.003 620.816 552.1 619.434L537.5 597.534L522.9 619.434C521.997 620.816 520.829 622.005 519.463 622.934C518.097 623.862 516.561 624.51 514.944 624.841C513.326 625.172 511.659 625.18 510.038 624.863C508.418 624.546 506.876 623.912 505.502 622.996C504.129 622.08 502.95 620.901 502.034 619.527C501.119 618.153 500.484 616.611 500.168 614.99C499.852 613.37 499.86 611.702 500.191 610.085C500.523 608.467 501.172 606.932 502.1 605.566L518.025 581.68L496.045 574.353C494.445 573.869 492.959 573.069 491.673 572.001C490.388 570.932 489.33 569.617 488.561 568.133C487.793 566.648 487.331 565.025 487.201 563.358C487.071 561.692 487.277 560.016 487.806 558.431C488.335 556.845 489.176 555.382 490.281 554.128C491.385 552.873 492.73 551.853 494.236 551.127C495.742 550.401 497.377 549.985 499.047 549.903C500.716 549.82 502.385 550.074 503.955 550.647L525 557.662V537.5C525 534.185 526.317 531.005 528.661 528.661C531.005 526.317 534.185 525 537.5 525C540.815 525 543.995 526.317 546.339 528.661C548.683 531.005 550 534.185 550 537.5V557.662L571.045 550.647C572.615 550.074 574.284 549.82 575.953 549.903C577.623 549.985 579.259 550.401 580.764 551.127C582.27 551.853 583.615 552.873 584.719 554.128C585.824 555.382 586.665 556.845 587.194 558.431C587.723 560.016 587.929 561.692 587.799 563.358C587.669 565.025 587.207 566.648 586.439 568.133C585.67 569.617 584.612 570.932 583.327 572.001C582.042 573.069 580.555 573.869 578.955 574.353ZM634.205 479.773C628.992 474.319 622.729 469.977 615.793 467.009C608.857 464.04 601.392 462.506 593.848 462.5H118.653C108.433 462.545 98.4248 465.408 89.7275 470.774C85.1744 433.539 88.2901 395.766 98.8828 359.78C109.476 323.794 127.321 290.357 151.321 261.527C175.321 232.697 204.968 209.084 238.436 192.141C271.905 175.198 308.486 165.285 345.93 163.01C383.373 160.736 420.886 166.149 456.159 178.916C491.432 191.683 523.718 211.534 551.032 237.247C578.345 262.96 600.107 293.992 614.977 328.431C629.848 362.87 637.513 399.988 637.5 437.5C637.48 451.654 636.382 465.787 634.205 479.773Z"/>
    </SvgIcon>;

useEffect(() => {
  console.log("CLEAN UP PREV PLAYLIST")
  return () => {
    setTracks([]); // Cleanup tracks when component unmounts
    audioRef.current.pause(); // Stop any playing audio
    audioRef.current = new Audio(); // Reset audio element
  };
}, []);

  useEffect(() => {
    setLoading(true);
    console.log("TRACKS OR ID HAVE CHANGED")

    const setTrackList = async () => {
      if (tracksList) {
        console.log("Using tracksList prop");
        setTracks(tracksList);
        setLoading(false);
      } else if (id) {
        console.log("Fetching tracks for playlist using id");
        const playlistData = await getPlaylist(id);
        console.log("Playlist Data from PreviewPlaylist Compt: ", playlistData)
        if (playlistData) {
          setTracks(playlistData.tracks);
          setLoading(false);
        }else{
          setLoading(false);
        }

      } else {
        console.log("No tracksList or id provided");
        setLoading(false);
      }
    };

     setTrackList();
  }, [id, tracksList]);

  console.log(tracks);

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
    console.log("Getting tracks for playlist");
  
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

        console.log(playlistData)
  
        if (!playlistData || !playlistData.items) {
          console.error("No playlist data available");
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
      console.error("Error fetching playlist tracks:", error);
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
      <TableContainer sx={{ 
        flex: 1, // Take up available space
        overflow: "auto",
        display: "flex",
        flexDirection: "column"}}
      >
        <Table aria-label="simple table"
        sx={{
          "& .MuiTableCell-root": {border: "none" },
          tableLayout: "fixed"
        }}
        >
          <TableHead sx={{ position: "sticky", top: 0}}>
            <TableRow>
              <TableCell sx={{width:"265px", p:'10px'}}>Title</TableCell>
              {view === "excluded" && <TableCell sx={{textAlign: "left", float:'right', p:'10px'}}>Reason</TableCell>}
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
                          {track.reason && (
                              <Box sx={{float:'right', m:2}}>
                                  {track.reason.includes('Profanity') && (
                                      <Tooltip title="Profanity"
                                      enterTouchDelay={0} 
                                      leaveTouchDelay={3000}
                                      >
                                         {profanityIcon}
                                      </Tooltip>
                                  )}
                                  {track.reason.includes('Violence') && (
                                      <Tooltip title="Violence"
                                      enterTouchDelay={0} 
                                      leaveTouchDelay={3000}
                                      >
                                          {violenceIcon}
                                      </Tooltip>
                                  )}
                                  {track.reason.includes('Sexual') && (
                                      <Tooltip 
                                      title="Sexual Content"
                                      enterTouchDelay={0} 
                                      leaveTouchDelay={3000}
                                      >
                                          <LocalFireDepartmentIcon/>
                                      </Tooltip>
                                  )}
                                  {track.reason.includes('No score') && (
                                      <Tooltip title="Error"
                                      enterTouchDelay={0} 
                                      leaveTouchDelay={3000}
                                      >
                                          <DiscFullIcon/>
                                      </Tooltip>
                                  )}
                              </Box>
                          )}
                      </>
                  )}

                    
                  { (view === 'included' || view === 'preview') && 
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
