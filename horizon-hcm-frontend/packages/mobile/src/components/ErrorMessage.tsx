import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface ErrorMessageProps {
  message: string;
  centered?: boolean;
}

export default function ErrorMessage({ message, centered = false }: ErrorMessageProps) {
  return <Text style={[styles.error, centered && styles.centered]}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
  },
  centered: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
