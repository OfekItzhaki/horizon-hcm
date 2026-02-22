import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Divider, List } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BuildingsStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<BuildingsStackParamList, 'BuildingDetail'>;

export default function BuildingDetailScreen({ route, navigation }: Props) {
  const { building } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{building.name}</Title>
          <Paragraph>{building.address}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Details</Title>
          <Divider style={styles.divider} />
          <List.Item
            title="Total Apartments"
            description={building.totalApartments?.toString() || '0'}
            left={(props) => <List.Icon {...props} icon="home-group" />}
          />
          <List.Item
            title="Total Residents"
            description={building.totalResidents?.toString() || '0'}
            left={(props) => <List.Icon {...props} icon="account-group" />}
          />
          <List.Item
            title="Year Built"
            description={building.yearBuilt?.toString() || 'N/A'}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Actions</Title>
          <Divider style={styles.divider} />
          <Button
            mode="contained"
            icon="home"
            onPress={() => navigation.navigate('ApartmentsList', { buildingId: building.id })}
            style={styles.button}
          >
            View Apartments
          </Button>
          <Button
            mode="contained"
            icon="account-multiple"
            onPress={() => navigation.navigate('ResidentsList', { buildingId: building.id })}
            style={styles.button}
          >
            View Residents
          </Button>
          <Button
            mode="outlined"
            icon="pencil"
            onPress={() => navigation.navigate('BuildingForm', { building })}
            style={styles.button}
          >
            Edit Building
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  button: {
    marginTop: 8,
  },
});
