import React, { useState } from 'react';
import { Box, Button, Typography, ToggleButton } from '@mui/material';
import logo from './auxmod_logo.svg';

function OnboardingSurvey({ survey, onSubmit }) {
  const [selectedChoices, setSelectedChoices] = useState([]);
  console.log(selectedChoices)

  const handleSubmit = () => {
    if (selectedChoices.length > 0) {
      onSubmit(selectedChoices);
    }
  };

  const handleSelection = (choice) => {
    if (!selectedChoices.includes(choice)) {
      setSelectedChoices([...selectedChoices, choice]);
    } else {
      setSelectedChoices(selectedChoices.filter(c => c !== choice));
    }
  };

  const choicesArray = survey?.questions?.[0]?.choices
    ? Object.keys(survey.questions[0].choices).map(key => survey.questions[0].choices[key])
    : [];

  return (
      <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '75vh', 
          textAlign: 'center',
          width: '100%',
         }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {survey?.questions[0]?.question}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mt: 3 }}>
          {choicesArray.length > 0 ? (
            choicesArray.map((choice, index) => (
              <ToggleButton
                key={index}
                value={choice}
                selected={selectedChoices.includes(choice)}
                onChange={() => handleSelection(choice)}
                sx={{
                  width: '90%',
                  mx: 'auto',
                  my: 1,
                  p: 2,
                  borderRadius: '8px',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  fontSize: '16px',
                  color:'text.primary',
                  backgroundColor: selectedChoices.includes(choice)
                    ? 'secondary.main'
                    : 'white',
                    border: `1.5px solid ${
                    selectedChoices.includes(choice)
                        ? 'primary.main'
                        : '#ccc'
                    }`,
                    borderRadius: '12px',
                    boxShadow: selectedChoices.includes(choice)
                    ? '0 4px 10px rgba(0,0,0,0.08)' 
                    : '0 2px 6px rgba(0,0,0,0.05)', 
                    transition: 'all 0.25s ease',
                    cursor: 'pointer',
                    '&:hover': {
                    backgroundColor: selectedChoices.includes(choice)
                        ? 'secondary.light'
                        : 'secondary.light',
                    boxShadow: '0 6px 14px rgba(0,0,0,0.12)', 
                    },


                }}
              >
                {choice}
              </ToggleButton>
            ))
          ) : (
            <Typography>No choices available</Typography>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={selectedChoices.length === 0}
          sx={{ mt: 4, minWidth: '200px' }}
        >
          Submit
        </Button>
      </Box>
  );
}

export default OnboardingSurvey;
