import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, Card, SegmentedButtons } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { EmptyState, LoadingSpinner, ErrorMessage } from '../../components';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#1976d2',
  },
};

export default function ReportsScreen() {
  const { selectedBuildingId } = useAppStore();
  const [reportType, setReportType] = useState('balance');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', selectedBuildingId, reportType],
    queryFn: async () => {
      if (!selectedBuildingId) return null;
      // Mock data - replace with actual API call
      return {
        balance: {
          totalIncome: 125000,
          totalExpense: 87500,
          balance: 37500,
          trend: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
              {
                data: [30000, 32000, 28000, 35000, 33000, 37500],
              },
            ],
          },
        },
        incomeExpense: {
          income: [45000, 48000, 42000, 50000, 47000, 52000],
          expense: [30000, 32000, 28000, 35000, 33000, 37500],
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        },
        categories: [
          { name: 'Maintenance', amount: 25000, color: '#f44336' },
          { name: 'Utilities', amount: 18000, color: '#2196f3' },
          { name: 'Insurance', amount: 12000, color: '#4caf50' },
          { name: 'Management', amount: 15000, color: '#ff9800' },
          { name: 'Other', amount: 17500, color: '#9e9e9e' },
        ],
      };
    },
    enabled: !!selectedBuildingId,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!selectedBuildingId) {
    return <EmptyState message="Please select a building first" />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading reports..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load reports" />;
  }

  const reportData = data || {
    balance: { totalIncome: 0, totalExpense: 0, balance: 0, trend: { labels: [], datasets: [] } },
    incomeExpense: { income: [], expense: [], labels: [] },
    categories: [],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <SegmentedButtons
        value={reportType}
        onValueChange={setReportType}
        buttons={[
          { value: 'balance', label: 'Balance' },
          { value: 'income', label: 'Income/Expense' },
          { value: 'categories', label: 'Categories' },
        ]}
        style={styles.segmented}
      />

      {reportType === 'balance' && (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>
                Financial Summary
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Total Income
                  </Text>
                  <Text variant="headlineSmall" style={[styles.summaryValue, styles.income]}>
                    ${reportData.balance.totalIncome.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Total Expense
                  </Text>
                  <Text variant="headlineSmall" style={[styles.summaryValue, styles.expense]}>
                    ${reportData.balance.totalExpense.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Balance
                  </Text>
                  <Text variant="headlineSmall" style={[styles.summaryValue, styles.balance]}>
                    ${reportData.balance.balance.toLocaleString()}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Balance Trend
              </Text>
              <LineChart
                data={reportData.balance.trend}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        </>
      )}

      {reportType === 'income' && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Income vs Expense
            </Text>
            <BarChart
              data={{
                labels: reportData.incomeExpense.labels,
                datasets: [
                  {
                    data: reportData.incomeExpense.income,
                  },
                  {
                    data: reportData.incomeExpense.expense,
                  },
                ],
              }}
              width={screenWidth - 64}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {reportType === 'categories' && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Expense by Category
            </Text>
            <PieChart
              data={reportData.categories.map((cat) => ({
                name: cat.name,
                amount: cat.amount,
                color: cat.color,
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
              }))}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
            <View style={styles.categoryList}>
              {reportData.categories.map((cat, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                  <Text variant="bodyMedium" style={styles.categoryName}>
                    {cat.name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.categoryAmount}>
                    ${cat.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
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
  segmented: {
    margin: 16,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  cardTitle: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  summaryLabel: {
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  income: {
    color: '#4caf50',
  },
  expense: {
    color: '#f44336',
  },
  balance: {
    color: '#1976d2',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryList: {
    marginTop: 16,
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
  },
  categoryAmount: {
    fontWeight: 'bold',
  },
});
