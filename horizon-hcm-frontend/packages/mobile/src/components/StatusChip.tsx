import React from 'react';
import { Chip } from 'react-native-paper';

interface StatusChipProps {
  status: string;
  getColor: (status: string) => string;
}

export default function StatusChip({ status, getColor }: StatusChipProps) {
  return (
    <Chip
      mode="flat"
      style={{ backgroundColor: getColor(status) }}
      textStyle={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}
    >
      {status.replace('_', ' ').toUpperCase()}
    </Chip>
  );
}
