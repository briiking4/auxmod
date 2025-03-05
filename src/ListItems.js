import * as React from 'react';
import Typography from '@mui/material/Typography';
import {Avatar, Container, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import musicNote from './music-note.svg'

export default function ListItems({sendData, list}) {

  const showSearch = (searchList) => {
    return searchList.map(function(item) {
      return (
        <Box
          key={item.id}
          sx={{
            p: 2,
            mb: 2,
            width: '100%',
            borderRadius: '8px',
            bgcolor: '#ebebeb',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#B3B3B3'
            },
            transition: 'background-color 0.3s ease',
            display: 'flex',
            alignItems: 'center'
          }}
          onClick={() => sendData(item)}
        >
          <Avatar
            src={item.images?.[0]?.url || musicNote}
            alt="card"
            variant="square"
            sx={{ 
              width: 48,
              height: 48,
              borderRadius: 1,
              flexShrink: 0  // Prevents the avatar from shrinking
            }}
          />
          
          <Box sx={{ 
            ml: 2,
            overflow: 'hidden',
            flex: 1  // Takes up remaining space
          }}>
            <Typography 
              variant="subtitle1"
              fontWeight="bold"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {item.name}
            </Typography>
            <Typography 
              variant="body2"
              color="textSecondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {item.owner?.display_name || item.artists?.[0]?.name}
            </Typography>
          </Box>
        </Box>
      );
    });
  };
  
  return (
    <Container sx={{mt:2, p:0}}>
      
      {showSearch(list)}

    </Container>
  );
}