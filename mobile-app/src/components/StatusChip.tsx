import React from 'react';
import { Chip } from 'react-native-paper';

interface StatusChipProps {
  status: string;
  color?: string;
}

export default function StatusChip({ status, color = '#757575' }: StatusChipProps) {
  return (
    <Chip
      mode="flat"
      style={{ backgroundColor: color }}
      textStyle={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}
    >
      {status.replace('_', ' ').toUpperCase()}
    </Chip>
  );
}
