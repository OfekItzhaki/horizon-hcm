import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, DataTable, Chip, ActivityIndicator, Searchbar, FAB, Portal, Dialog, TextInput } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildingsApi, adminApi } from '@horizon-hcm/shared';

type Tab = 'buildings' | 'audit' | 'users';

export default function AdminScreen() {
  const [tab, setTab] = useState<Tab>('buildings');
  const [search, setSearch] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<any>(null);
  const [form, setForm] = useState({ name: '', addressLine: '', city: '', postalCode: '' });
  const queryClient = useQueryClient();

  // Buildings
  const { data: buildingsData, isLoading: buildingsLoading } = useQuery({
    queryKey: ['mobile-admin-buildings'],
    queryFn: () => buildingsApi.getAll(),
    enabled: tab === 'buildings',
  });

  const buildings: any[] = (buildingsData?.data as any) ?? [];
  const filtered = buildings.filter(
    (b) =>
      !search ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.address_line?.toLowerCase().includes(search.toLowerCase()),
  );

  const createMutation = useMutation({
    mutationFn: (payload: any) => buildingsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-admin-buildings'] });
      setFormVisible(false);
      setForm({ name: '', addressLine: '', city: '', postalCode: '' });
    },
    onError: () => Alert.alert('Error', 'Failed to save building'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => buildingsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-admin-buildings'] });
      setFormVisible(false);
      setEditingBuilding(null);
    },
    onError: () => Alert.alert('Error', 'Failed to update building'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => buildingsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mobile-admin-buildings'] }),
    onError: () => Alert.alert('Error', 'Failed to delete building'),
  });

  const handleOpenCreate = () => {
    setEditingBuilding(null);
    setForm({ name: '', addressLine: '', city: '', postalCode: '' });
    setFormVisible(true);
  };

  const handleOpenEdit = (b: any) => {
    setEditingBuilding(b);
    setForm({ name: b.name || '', addressLine: b.address_line || '', city: b.city || '', postalCode: b.postal_code || '' });
    setFormVisible(true);
  };

  const handleDelete = (b: any) => {
    Alert.alert('Delete Building', `Delete "${b.name || b.address_line}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(b.id) },
    ]);
  };

  const handleSubmit = () => {
    const payload = { name: form.name || undefined, addressLine: form.addressLine, city: form.city || undefined, postalCode: form.postalCode || undefined };
    if (editingBuilding) {
      updateMutation.mutate({ id: editingBuilding.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Audit logs
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['mobile-audit-logs'],
    queryFn: () => adminApi.getAuditLogs({ limit: 50 }),
    enabled: tab === 'audit',
  });

  const auditLogs: any[] = (auditData?.data as any)?.data ?? [];

  // Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['mobile-admin-users'],
    queryFn: () => adminApi.getUsers({ limit: 100 }),
    enabled: tab === 'users',
  });

  const adminUsers: any[] = (usersData?.data as any)?.data ?? [];

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabs}>
        <Button
          mode={tab === 'buildings' ? 'contained' : 'outlined'}
          onPress={() => setTab('buildings')}
          style={styles.tabBtn}
          compact
        >
          Buildings
        </Button>
        <Button
          mode={tab === 'audit' ? 'contained' : 'outlined'}
          onPress={() => setTab('audit')}
          style={styles.tabBtn}
          compact
        >
          Audit Log
        </Button>
        <Button
          mode={tab === 'users' ? 'contained' : 'outlined'}
          onPress={() => setTab('users')}
          style={styles.tabBtn}
          compact
        >
          Users
        </Button>
      </View>

      {tab === 'buildings' && (
        <>
          <Searchbar
            placeholder="Search buildings..."
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />
          {buildingsLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <ScrollView>
              {filtered.map((b) => (
                <Card key={b.id} style={styles.card}>
                  <Card.Content>
                    <Text variant="titleMedium">{b.name || b.address_line}</Text>
                    <Text variant="bodySmall" style={styles.subtitle}>{b.address_line}{b.city ? `, ${b.city}` : ''}</Text>
                    <View style={styles.row}>
                      <Chip compact>{b.is_active ? 'Active' : 'Inactive'}</Chip>
                      {b.num_units && <Text variant="bodySmall"> {b.num_units} units</Text>}
                    </View>
                  </Card.Content>
                  <Card.Actions>
                    <Button onPress={() => handleOpenEdit(b)}>Edit</Button>
                    <Button textColor="red" onPress={() => handleDelete(b)}>Delete</Button>
                  </Card.Actions>
                </Card>
              ))}
              {filtered.length === 0 && (
                <Text style={styles.empty}>No buildings found</Text>
              )}
            </ScrollView>
          )}
          <FAB icon="plus" style={styles.fab} onPress={handleOpenCreate} />
        </>
      )}

      {tab === 'audit' && (
        <ScrollView>
          {auditLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Action</DataTable.Title>
                <DataTable.Title>Resource</DataTable.Title>
                <DataTable.Title>Time</DataTable.Title>
              </DataTable.Header>
              {auditLogs.map((log) => (
                <DataTable.Row key={log.id}>
                  <DataTable.Cell>{log.action}</DataTable.Cell>
                  <DataTable.Cell>{log.resource_type || '—'}</DataTable.Cell>
                  <DataTable.Cell>{new Date(log.created_at).toLocaleDateString()}</DataTable.Cell>
                </DataTable.Row>
              ))}
              {auditLogs.length === 0 && (
                <Text style={styles.empty}>No audit logs</Text>
              )}
            </DataTable>
          )}
        </ScrollView>
      )}

      {tab === 'users' && (
        <ScrollView>
          {usersLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Name / Email</DataTable.Title>
                <DataTable.Title>Roles</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
              </DataTable.Header>
              {adminUsers.map((u) => (
                <DataTable.Row key={u.id}>
                  <DataTable.Cell>{u.fullName || u.email}</DataTable.Cell>
                  <DataTable.Cell>{u.roles?.join(', ') || '—'}</DataTable.Cell>
                  <DataTable.Cell>{u.isActive ? 'Active' : 'Inactive'}</DataTable.Cell>
                </DataTable.Row>
              ))}
              {adminUsers.length === 0 && (
                <Text style={styles.empty}>No users found</Text>
              )}
            </DataTable>
          )}
        </ScrollView>
      )}

      {/* Building form dialog */}
      <Portal>
        <Dialog visible={formVisible} onDismiss={() => setFormVisible(false)}>
          <Dialog.Title>{editingBuilding ? 'Edit Building' : 'Add Building'}</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} mode="outlined" style={styles.input} />
            <TextInput label="Address *" value={form.addressLine} onChangeText={(v) => setForm({ ...form, addressLine: v })} mode="outlined" style={styles.input} />
            <TextInput label="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} mode="outlined" style={styles.input} />
            <TextInput label="Postal Code" value={form.postalCode} onChangeText={(v) => setForm({ ...form, postalCode: v })} mode="outlined" style={styles.input} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFormVisible(false)}>Cancel</Button>
            <Button
              onPress={handleSubmit}
              disabled={!form.addressLine || createMutation.isPending || updateMutation.isPending}
            >
              {editingBuilding ? 'Save' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: { flexDirection: 'row', padding: 12, gap: 8 },
  tabBtn: { flex: 1 },
  search: { margin: 12, marginTop: 0 },
  loader: { marginTop: 40 },
  card: { margin: 12, marginBottom: 4 },
  subtitle: { color: '#666', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  empty: { textAlign: 'center', margin: 24, color: '#999' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  input: { marginBottom: 8 },
});
