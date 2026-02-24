import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Title, Paragraph, Button, Divider, Chip, List } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FinanceStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<FinanceStackParamList, 'InvoiceDetail'>;

function InvoiceDetailScreen({ route, navigation }: Props) {
  const { invoice } = route.params;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'overdue':
        return '#f44336';
      case 'cancelled':
        return '#9e9e9e';
      default:
        return '#757575';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title>Invoice #{invoice.id.slice(0, 8)}</Title>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(invoice.status) }]}
              textStyle={styles.statusText}
            >
              {invoice.status.toUpperCase()}
            </Chip>
          </View>
          <Paragraph style={styles.description}>{invoice.description}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Details</Title>
          <Divider style={styles.divider} />
          <List.Item
            title="Amount"
            description={`${invoice.currency || '$'} ${invoice.amount.toFixed(2)}`}
            left={(props) => <List.Icon {...props} icon="currency-usd" />}
          />
          <List.Item
            title="Created Date"
            description={new Date(invoice.createdAt).toLocaleDateString()}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
          <List.Item
            title="Due Date"
            description={new Date(invoice.dueDate).toLocaleDateString()}
            left={(props) => <List.Icon {...props} icon="calendar-alert" />}
          />
          {invoice.paidAt && (
            <List.Item
              title="Paid Date"
              description={new Date(invoice.paidAt).toLocaleDateString()}
              left={(props) => <List.Icon {...props} icon="calendar-check" />}
            />
          )}
        </Card.Content>
      </Card>

      {invoice.status === 'pending' && (
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              icon="credit-card"
              onPress={() => navigation.navigate('PaymentForm', { invoice })}
              style={styles.button}
            >
              Pay Now
            </Button>
          </Card.Content>
        </Card>
      )}

      {invoice.status === 'paid' && (
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="outlined"
              icon="download"
              onPress={() => {
                // TODO: Download receipt
                console.log('Download receipt');
              }}
              style={styles.button}
            >
              Download Receipt
            </Button>
          </Card.Content>
        </Card>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  divider: {
    marginVertical: 8,
  },
  button: {
    marginTop: 8,
  },
});

export default InvoiceDetailScreen;
