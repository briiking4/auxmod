// FilterTypes/ButtonFilter.jsx
import React from 'react';
import { Button } from '@mui/material';

const ButtonFilter = ({ filter, onToggle, disabled, iconMap }) => {
  const IconComponent = iconMap[filter.icon];
  
  return (
    <Button
      disabled={disabled}
      sx={{
        flexGrow: 1,
        flexBasis: 0,
        maxWidth: '150px',
        minWidth: '120px',
        height: '40px',
        display: 'flex',
        color: 'text.primary',
        borderColor: 'secondary.main',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: filter.isSelected ? 'secondary.main' : 'secondary.light',
        borderRadius: '50px'
      }}
      startIcon={IconComponent}
      onClick={onToggle}
    >
      {filter.label}
    </Button>
  );
};

export default ButtonFilter;