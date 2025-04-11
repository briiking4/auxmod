// filterConfig.js - Central place for filter definitions
import ProfanityIcon from "./ProfanityIcon.js"
import ViolenceIcon from "./ViolenceIcon.js"
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

export const filterCategories = [
  {
    id: 'moderation',
    title: 'Filter out songs that contain:',
    description: 'Select one or more filters:',
    info: "Clean versions swapped in for profanity-only songs. Spanish support for profanity filter coming soon.",
    placement: 'main', // Determines where this category appears
    order: 1, // Controls vertical ordering
    filters: [
      {
        id: 'profanity',
        label: 'Profanity',
        type: 'button',
        icon: 'profanityIcon', // Reference to icon component
        defaultSelected: false,
        options: { whitelist: [] }
      },
      {
        id: 'violence',
        label: 'Violence',
        type: 'button',
        icon: 'violenceIcon',
        defaultSelected: false,
        options: {}
      },
      {
        id: 'sexual',
        label: 'Sexual',
        type: 'button',
        icon: 'sexualIcon',
        defaultSelected: false,
        options: {}
      },
    ]
  },
  // {
  //   id: 'audioFeature',
  //   title: 'Audio Features',
  //   description: 'Adjust sound characteristics:',
  //   placement: 'main',
  //   order: 2,
  //   filters: [
  //     {
  //       id: 'loudness',
  //       label: 'Loudness',
  //       type: 'slider',
  //       startIcon: 'volumeIcon',
  //       defaultSelected: false,
  //       defaultValue: 0,
  //       min: 0,
  //       max: 100,
  //       step: 1
  //     },
  //   ]
  // },
  // Add more categories as needed
];

// Map of icon references to actual components
export const iconMap = {
  profanityIcon:<ProfanityIcon/>,
  violenceIcon:<ViolenceIcon/>,
  volumeIcon: <VolumeUpIcon/>,
  sexualIcon: <LocalFireDepartmentIcon/>
  // Add more icons as needed
};