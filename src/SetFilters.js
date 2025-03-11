import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import {Container, Typography, Button, IconButton, Box, LinearProgress, Alert, Tooltip, CircularProgress} from '@mui/material';
import Filter from './Filter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import ReactGA from 'react-ga4';
import FilterListIcon from '@mui/icons-material/FilterList';

// Create a simple event emitter outside component to avoid re-renders
const filterState = {
  hasSelectedFilters: false,
  currentFilters: []
};

export default function SetFilters({sendStatus, chosenPlaylist, onApplyFilters, sendChosenFilters, progress}) {
  const [loading, setLoading] = useState(false);
  // Only for the button disabled state
  const [buttonDisabled, setButtonDisabled] = useState(true);

  const [loadingProgress, setProgress] = useState(0);

  // Google Analytics tracking:

  useEffect(() => {
      ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: "Set Filters" });
  }, []);


  // Function passed to Filter component that doesn't trigger re-renders in SetFilters
  const handleFilterUpdate = (filters) => {
    // Store filters without causing a re-render
    filterState.currentFilters = filters;
    
    // Check if any filters are selected
    const anySelected = filters.some(filter => filter.isSelected);
    filterState.hasSelectedFilters = anySelected;
    
    // Only update state if button disabled status changed
    if (buttonDisabled !== !anySelected) {
      setButtonDisabled(!anySelected);
    }
  };

  const handleApplyFilters = async () => {
    ReactGA.event({
      category: 'User',
      action: `Apply Filters Clicked`
    });

    setLoading(true);
    
    // Get the currently selected filter labels
    const selectedFiltersList = filterState.currentFilters
      .filter(filter => filter.isSelected)
      .map(filter => filter.label);
    
    // Send chosen filters to parent
    sendChosenFilters(selectedFiltersList);
    onApplyFilters(selectedFiltersList);
  };

  const sendStepStatus = (state) => {
    sendStatus(state);
  };

  return (
    <Container sx={{ mt: 2, p:0 }}>
      <Box sx={{mt:-3}}>
        <IconButton
          aria-label="back"
          size="large"
          onClick={async () => {
            // setProgress(0);
            sendStepStatus(false);
          }}
          sx={{p:0, mb:2}}
          disabled={loading}
        >
          <ArrowBackIcon sx={{ p: 0}} fontSize="inherit" />
        </IconButton>
      </Box>

      <Typography variant="h6">Exclude songs with:</Typography>
      <Box sx={{ mt: 1, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mr: 1 }}>Select one or more:</Typography>
        <Tooltip title="Profanity filter will swap for clean/radio version replacements if available." 
        enterTouchDelay={0} 
        leaveTouchDelay={3000}>
          <InfoIcon fontSize="small" color="secondary.main" />
        </Tooltip>
      </Box>

      <Filter sendModerationFiltersStatus={handleFilterUpdate} type="moderation" loading={loading}/>


      <Box sx={{ position: 'relative', mt: 5, maxWidth: '180px' }}>
        <Button 
          variant="contained" 
          sx={{ 
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '50px',
            width: '100%',
            height: '48px', // Consistent height
            transition: 'all 0.3s ease',
            boxShadow: loading ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
          disabled={buttonDisabled}
          onClick={!loading ? handleApplyFilters : undefined}
        >
          <Box sx={{ 
            position: 'relative', 
            zIndex: 2, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            fontWeight: loading ? 'bold' : 'normal',
          }}>
            {loading ? (
              <>
                <CircularProgress 
                  size={20} 
                  thickness={5}
                  sx={{ 
                    color: 'white', 
                    marginRight: '8px',
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }} 
                />
                {`${Math.round(progress)}%`}
              </>
            ) : (
              <>
                <FilterListIcon sx={{ marginRight: '8px' }} />
                Apply Filters
              </>
            )}
          </Box>
          
          {loading && (
            <>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'primary.dark',
                  borderRadius: 'inherit',
                  zIndex: 1,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'primary.main',
                    transition: 'transform 0.4s ease',
                  }
                }}
              />
            </>
          )}
        </Button>

        <style jsx global>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </Box>
    </Container>
  );
}