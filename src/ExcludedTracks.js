import * as React from 'react';
import {Box, Button, Container, Typography, Modal} from '@mui/material';


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  minWidth: '360px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: '10px',
  p: 4,
};

export default function ExcludedTracks({tracks}) {
  console.log("Excluded Tracks: The tracks are: ")
  console.log(tracks);

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
        <Container
        sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'start',
            '& .MuiButtonBase-root': {
            borderRadius: '50px',
            },
            p:0,
            ml:-1,
            mt:2
        }}
        >
        <Button 
        variant="contained" 
        sx={{ minWidth: '170px', minHeight:'15px' }}
        onClick={handleOpen}
        size="small"
        >
            View Excluded Tracks
        </Button>
        </Container>  

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
           Excluded tracks
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2}}>
           Songs that did not pass the filter or lacked a clean version replacement
          </Typography>
          <Box>
            {
                tracks.length > 0 ?
                    <ol>
                    {tracks.map((track, index) => (
                        <li key={track.id}>{track.name} by {track.artists[0].name}</li>
                    ))}
                </ol>

                :
                <Typography sx={{ mt: 2}}>
                    "All songs passed the filter or have clean replacements
               </Typography>

            }
           
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
