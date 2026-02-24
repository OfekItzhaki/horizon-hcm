import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, IconButton, FAB } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@horizon-hcm/shared/src/api/documents';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { useAuthStore } from '@horizon-hcm/shared/src/store/auth.store';
import { EmptyState, ErrorMessage, LoadingSpinner } from '../../components';
import { pickDocument, formatFileSize as formatSize } from '../../utils/filePicker';

export default function DocumentsScreen() {
  const { selectedBuildingId } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', selectedBuildingId],
    queryFn: () => documentsApi.getAll(selectedBuildingId!),
    enabled: !!selectedBuildingId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: any) => documentsApi.upload(selectedBuildingId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      Alert.alert('Success', 'Document uploaded successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to upload document');
    },
  });

  const documents = data?.data?.data || [];
  const canUpload = user?.role === 'committee_member' || user?.role === 'admin';

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleUpload = async () => {
    try {
      const results = await pickDocument();

      if (results && results[0]) {
        const file = results[0];
        uploadMutation.mutate(file);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      // In a real app, implement download functionality
      Alert.alert('Download', `Downloading ${fileName}...`);
    } catch (err) {
      Alert.alert('Error', 'Failed to download document');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return 'file-pdf-box';
    if (fileType.includes('image')) return 'file-image';
    if (fileType.includes('word')) return 'file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'file-excel';
    return 'file-document';
  };

  const formatFileSize = (bytes: number) => formatSize(bytes);

  if (!selectedBuildingId) {
    return <EmptyState message="Please select a building first" />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading documents..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load documents" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <IconButton
                  icon={getFileIcon(item.fileType)}
                  size={32}
                  iconColor="#2196f3"
                />
                <View style={styles.info}>
                  <Text variant="titleMedium" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    {formatFileSize(item.fileSize)} • {item.category}
                  </Text>
                  <Text variant="bodySmall" style={styles.date}>
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
                <IconButton
                  icon="download"
                  onPress={() => handleDownload(item.fileName)}
                />
              </View>
              {item.description && (
                <Text variant="bodySmall" style={styles.description}>
                  {item.description}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<EmptyState message="No documents found" icon="file-document" />}
      />
      {canUpload && (
        <FAB
          icon="upload"
          style={styles.fab}
          onPress={handleUpload}
          loading={uploadMutation.isPending}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 8,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 8,
  },
  meta: {
    color: '#666',
    marginTop: 4,
  },
  date: {
    color: '#999',
    marginTop: 2,
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  tag: {
    marginRight: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
