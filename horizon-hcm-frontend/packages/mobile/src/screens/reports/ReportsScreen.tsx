import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { List, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FinanceStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<FinanceStackParamList, 'ReportsList'>;

export default function ReportsScreen({ navigation: _navigation }: Props) {
  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Financial Reports</List.Subheader>
        <List.Item
          title="Balance Report"
          description="View income, expenses, and current balance"
          left={(props) => <List.Icon {...props} icon="scale-balance" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {}}
        />
        <Divider />
        <List.Item
          title="Income & Expense"
          description="Detailed breakdown by category"
          left={(props) => <List.Icon {...props} icon="chart-pie" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {}}
        />
        <Divider />
        <List.Item
          title="Budget Comparison"
          description="Compare budgeted vs actual amounts"
          left={(props) => <List.Icon {...props} icon="chart-bar" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {}}
        />
        <Divider />
        <List.Item
          title="Year over Year"
          description="Compare performance across years"
          left={(props) => <List.Icon {...props} icon="chart-line" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {}}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
