import React, { useState } from 'react';
import { Box, Button, Popover, Stack, Chip, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  label?: string;
}

const presets = [
  {
    label: 'This Month',
    getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }),
  },
  {
    label: 'Last Month',
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: 'This Year',
    getValue: () => ({ start: startOfYear(new Date()), end: endOfYear(new Date()) }),
  },
  {
    label: 'Last Year',
    getValue: () => ({
      start: startOfYear(subYears(new Date(), 1)),
      end: endOfYear(subYears(new Date(), 1)),
    }),
  },
];

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'Date Range',
}: DateRangePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    const { start, end } = preset.getValue();
    onStartDateChange(start);
    onEndDateChange(end);
  };

  const open = Boolean(anchorEl);

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'Select date range';
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    if (startDate) return `From ${startDate.toLocaleDateString()}`;
    if (endDate) return `Until ${endDate.toLocaleDateString()}`;
    return 'Select date range';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Button variant="outlined" onClick={handleClick} fullWidth>
          {label}: {formatDateRange()}
        </Button>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <Box sx={{ p: 2, minWidth: 400 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Presets
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {presets.map((preset) => (
                <Chip
                  key={preset.label}
                  label={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  clickable
                />
              ))}
            </Stack>
            <Stack spacing={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={onStartDateChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={onEndDateChange}
                minDate={startDate || undefined}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <Button onClick={handleClose} variant="contained">
                Apply
              </Button>
            </Stack>
          </Box>
        </Popover>
      </Box>
    </LocalizationProvider>
  );
}
