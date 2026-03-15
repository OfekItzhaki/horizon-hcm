import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, Card, SegmentedButtons } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { reportsApi } from '@horizon-hcm/shared';
import { EmptyState, LoadingSpinner, ErrorMessage } from '../../components';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: '#1976d2' },
};

export default function ReportsScreen() {
  const { selectedBuildingId } = useAppStore();
  const [reportType, setReportType] = useState('balance');
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString();

  const { data: balanceData, isLoading, error, refetch } = useQuery({
    queryKey: ['mobile-reports-balance', selectedBuildingId],
    queryFn: () => reportsApi.getBalance(selectedBuildingId!, { startDate: yearStart, endDate: today.toISOString() }),
    enabled: !!selectedBuildingId,
  });

  const { data: incomeData, refetch: refetchIncome } = useQuery({
    queryKey: ['mobile-reports-income', selectedBuildingId],
    queryFn: () => reportsApi.getIncomeExpense(selectedBuildingId!, { startDate: yearStart, endDate: today.toISOString() }),
    enabled: !!selectedBuildingId,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchIncome()]);
    setRefreshing(false);
  };

  if (!selectedBuildingId) return <EmptyState message="Please select a building first" />;
  if (isLoading) return <LoadingSpinner message="Loading reports..." />;
  if (error) return <ErrorMessage message="Failed to load reports" />;

  const balance = balanceData?.data as any;
  const totalIncome = Number(balance?.totalIncome ?? balance?.total_income ?? 0);
  const totalExpense = Number(balance?.totalExpenses ?? balance?.total_expenses ?? 0);
  const currentBalance = Number(balance?.balance ?? balance?.current_balance ?? 0);

  const income = incomeData?.data as any;
  const monthlyLabels: string[] = income?.labels ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const monthlyIncome: number[] = income?.income ?? income?.incomeData ?? [0, 0, 0, 0, 0, 0];
  const monthlyExpense: number[] = income?.expenses ?? income?.expenseData ?? [0, 0, 0, 0, 0, 0];

  const categories: any[] = income?.categories ?? balance?.categories ?? [];
  const COLORS = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9e9e9e', '#9c27b0'];

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
          { value: 'income', label: 'Income/Exp' },
          { value: 'categories', label: 'Categories' },
        ]}
        style={styles.segmented}
      />

      {reportType === 'balance' && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Financial Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>Total Income</Text>
                <Text variant="headlineSmall" style={[styles.summaryValue, styles.income]}>
                  ₪{totalIncome.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>Total Expense</Text>
                <Text variant="headlineSmall" style={[styles.summaryValue, styles.expense]}>
                  ₪{totalExpense.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>Balance</Text>
                <Text variant="headlineSmall" style={[styles.summaryValue, styles.balanceText]}>
                  ₪{currentBalance.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {reportType === 'income' && monthlyIncome.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Income vs Expense</Text>
            <BarChart
              data={{ labels: monthlyLabels.slice(0, 6), datasets: [{ data: monthlyIncome.slice(0, 6) }] }}
              width={screenWidth - 64}
              height={220}
              yAxisLabel="₪"
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
            <Text variant="titleMedium" style={styles.cardTitle}>Expense by Category</Text>
            {categories.length === 0 ? (
              <Text style={styles.empty}>No category data available</Text>
            ) : (
              <>
                <PieChart
                  data={categories.map((cat: any, i: number) => ({
                    name: cat.category || cat.name,
                    amount: Number(cat.amount),
                    color: COLORS[i % COLORS.length],
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
                  {categories.map((cat: any, i: number) => (
                    <View key={i} style={styles.categoryItem}>
                      <View style={[styles.categoryDot, { backgroundColor: COLORS[i % COLORS.length] }]} />
                      <Text variant="bodyMedium" style={styles.categoryName}>{cat.category || cat.name}</Text>
                      <Text variant="bodyMedium" style={styles.categoryAmount}>₪{Number(cat.amount).toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  segmented: { margin: 16 },
  card: { margin: 16, marginTop: 8 },
  cardTitle: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  summaryItem: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 },
  summaryLabel: { color: '#666', marginBottom: 4 },
  summaryValue: { fontWeight: 'bold' },
  income: { color: '#4caf50' },
  expense: { color: '#f44336' },
  balanceText: { color: '#1976d2' },
  chart: { marginVertical: 8, borderRadius: 16 },
  categoryList: { marginTop: 16, gap: 8 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  categoryDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  categoryName: { flex: 1 },
  categoryAmount: { fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#999', marginVertical: 16 },
});
