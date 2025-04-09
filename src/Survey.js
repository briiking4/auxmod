import React, { useState } from 'react';
import { Popover, Box, TextField, Button, Typography } from '@mui/material';

function Survey({ title, onDismiss, onSubmit }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [feedback, setFeedback] = useState('');

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    if (onDismiss) onDismiss();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(feedback);
    setFeedback('');
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <Button aria-describedby={id} variant="contained" onClick={handleClick}>
        Leave feedback
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '10px'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', padding: "20px", width: "300px" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              id="outlined-multiline-flexible"
              label="Start typing..."
              multiline
              fullWidth
              maxRows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                type="submit"
              >
                Submit
              </Button>
            </Box>
          </form>
        </Box>
      </Popover>
    </div>
  );
}

export default Survey;