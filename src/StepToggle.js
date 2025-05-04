import * as React from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CheckIcon from '@mui/icons-material/Check';


export default function StepToggle({stepsStatus, activeStep}) {

  console.log("Active Step: " + activeStep)
  console.log("Steps Status: " + stepsStatus)


  const Step = ({ label, description, hasLine, isComplete, isActive }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Box
        sx={{
          width: 35,
          height: 35,
          display:'flex',
          borderRadius: '50%',
          backgroundColor: isActive || isComplete ? 'secondary.main' : 'secondary.light',
          position: 'relative',
          justifyContent:'center',
          alignItems:'center',
        }}
      >
        {isComplete ? 
        <CheckIcon 
          sx={{
            fontSize:'inherit',
            width:'75%',
            strokeWidth: 2,
            height:'inherit',
            stroke:'black'
          }}
       /> : <></>}
      </Box>
      {hasLine && (
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            right: '-25%',
            width: '50%',
            height: 2,
            backgroundColor: '#F4E0C7',
          }}
        />
      )}
      <Typography variant="body1" sx={{ mt: 1, color:'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5,color:'text.primary', fontWeight:'bold' }}>
        {description}
      </Typography>
    </Box>
  );

// Defining the Steps
  const steps = [
    { label: 'Step 1', description: 'Pick a Playlist', isComplete: stepsStatus[0]},
    { label: 'Step 2', description: 'Set Filters', isComplete: stepsStatus[1] },
    { label: 'Step 3', description: 'Review & Save Playlist',  isComplete: stepsStatus[2]},
  ];

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ pt: '10px', pb:'20px', position: 'relative' }}
      >
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <Grid
              item
              sx={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: `${100 /steps.length}%`,
                position: 'relative',
              }}
            >
              <Step
                label={step.label}
                description={step.description}
                hasLine={index < steps.length - 1}
                isComplete={step.isComplete}
                isActive={activeStep === index}
              />
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
    </Box>
  );
}
