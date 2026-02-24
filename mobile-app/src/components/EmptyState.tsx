import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';

interface EmptyStateProps {
  message: string;
  icon?: string;
}

export default function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <Icon source={icon} size={48} color="#9e9e9e" />}
      <Text variant="bodyLarge" style={[styles.message, { marginTop: icon ? 16 : 0 }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  message: {
    textAlign: 'center',
    color: '#666',
  },
});
