import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Banner, ActivityIndicator, Text } from 'react-native-paper';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { t } from '../i18n';

export default function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();

  if (isOnline && !isSyncing) return null;

  const message = isSyncing
    ? t('common.syncing')
    : pendingCount > 0
    ? `${t('offline.cachedData')} · ${pendingCount} ${t('offline.pendingSync')}`
    : t('offline.banner');

  return (
    <View style={styles.container}>
      <Banner
        visible
        icon={isSyncing ? undefined : 'wifi-off'}
        style={[styles.banner, isSyncing && styles.syncing]}
        actions={
          !isSyncing && pendingCount > 0
            ? [{ label: t('offline.syncNow'), onPress: syncNow }]
            : []
        }
      >
        <View style={styles.row}>
          {isSyncing && <ActivityIndicator size={14} style={styles.spinner} />}
          <Text style={styles.text}>{message}</Text>
        </View>
      </Banner>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: '#ff9800',
  },
  syncing: {
    backgroundColor: '#1976d2',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
  },
});
