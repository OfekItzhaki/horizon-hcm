import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Banner } from 'react-native-paper';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Simple connectivity check using fetch
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/health', {
          method: 'HEAD',
          timeout: 5000,
        } as any);
        setIsOffline(!response.ok);
      } catch (error) {
        setIsOffline(true);
      }
    };

    // Check immediately
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Banner
        visible={isOffline}
        icon="wifi-off"
        style={styles.banner}
      >
        You are offline. Some features may be limited.
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
});
