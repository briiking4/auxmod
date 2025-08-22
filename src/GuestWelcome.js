import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

export default function GuestWelcome() {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="guest-dialog-title"
      aria-describedby="guest-dialog-description"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="guest-dialog-title" sx={{ textAlign: "center" }}>
        Welcome to auXmod!
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="guest-dialog-description"
          sx={{ textAlign: "center", fontSize: "1rem" }}
        >
          You’re trying out auXmod in guest mode 🎵 <br/>
          To filter private playlists and save your auXmod-created playlists, please log in with Spotify.<br/>
                
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center" }}>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            px: 3,
            py: 1,
          }}
        >
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );
}
