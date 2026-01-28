// Application constants

export const SPLIT_PRESETS = {
  'social': { label: 'Social Media (15s - 60s)', min: 15, max: 60 },
  'short': { label: 'Short Clips (1 - 5 min)', min: 60, max: 300 },
  'medium': { label: 'Medium Segments (5 - 15 min)', min: 300, max: 900 },
  'movie': { label: 'Movie Chapters (15 - 30 min)', min: 900, max: 1800 },
  'custom': { label: 'Custom', min: 60, max: 600 }
};

export const NAV_ITEMS = [
  { path: '/', icon: 'Home', label: 'Dashboard' },
  { path: '/projects', icon: 'FolderOpen', label: 'Projects' },
  { path: '/videos', icon: 'Video', label: 'Videos' },
  { path: '/split-jobs', icon: 'Scissors', label: 'Split Jobs' },
  { path: '/clips', icon: 'Film', label: 'Clips' },
  { path: '/templates', icon: 'LayoutIcon', label: 'Templates' },
  { path: '/ai-analysis', icon: 'Brain', label: 'AI Analysis' },
  { path: '/exports', icon: 'Download', label: 'Exports' },
];
