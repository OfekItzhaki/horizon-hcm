import { Tooltip, IconButton } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

interface HelpTooltipProps {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ title, placement = 'top' }: HelpTooltipProps) {
  return (
    <Tooltip title={title} placement={placement} arrow>
      <IconButton size="small" sx={{ ml: 0.5 }}>
        <HelpOutline fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
