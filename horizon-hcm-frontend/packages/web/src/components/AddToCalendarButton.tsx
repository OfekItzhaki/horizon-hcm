import { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Event, Google, CalendarMonth, Download } from '@mui/icons-material';
import type { Meeting } from '@horizon-hcm/shared/src/types/meeting';
import { addToCalendar } from '../utils/calendar';

interface AddToCalendarButtonProps {
  meeting: Meeting;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

export function AddToCalendarButton({
  meeting,
  variant = 'outlined',
  size = 'medium',
}: AddToCalendarButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddToCalendar = (provider: 'google' | 'outlook' | 'apple' | 'download') => {
    addToCalendar(meeting, provider);
    handleClose();
  };

  return (
    <>
      <Button variant={variant} size={size} startIcon={<Event />} onClick={handleClick}>
        Add to Calendar
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => handleAddToCalendar('google')}>
          <ListItemIcon>
            <Google fontSize="small" />
          </ListItemIcon>
          <ListItemText>Google Calendar</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAddToCalendar('outlook')}>
          <ListItemIcon>
            <CalendarMonth fontSize="small" />
          </ListItemIcon>
          <ListItemText>Outlook Calendar</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAddToCalendar('apple')}>
          <ListItemIcon>
            <CalendarMonth fontSize="small" />
          </ListItemIcon>
          <ListItemText>Apple Calendar</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAddToCalendar('download')}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download .ics File</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
