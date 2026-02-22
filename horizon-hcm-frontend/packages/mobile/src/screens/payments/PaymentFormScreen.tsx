import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TextInput, Button, HelperText, Card, Title, Paragraph } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FinanceStackParamList } from '../../types/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const paymentSchema = z.object({
  cardNumber: z.string().min(13, 'Invalid card number').max(19, 'Invalid card number'),
  cardHolder: z.string().min(1, 'Cardholder name is required'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY'),
  cvv: z.string().min(3, 'CVV must be 3-4 digits').max(4, 'CVV must be 3-4 digits'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

type Props = NativeStackScreenProps<FinanceStackParamList, 'PaymentForm'>;

export default function PaymentFormScreen({ route, navigation }: Props) {
  const { invoice } = route.params;
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    setLoading(true);
    try {
      // TODO: Call API to process payment
      console.log('Payment data:', data);
      navigation.navigate('InvoicesList');
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Invoice #{invoice.number}</Title>
          <Paragraph style={styles.amount}>Amount: ${invoice.amount.toFixed(2)}</Paragraph>
          <Paragraph>{invoice.description}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Payment Details</Title>

          <Controller
            control={control}
            name="cardNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Card Number *"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.cardNumber}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                  maxLength={19}
                  left={<TextInput.Icon icon="credit-card" />}
                />
                {errors.cardNumber && (
                  <HelperText type="error">{errors.cardNumber.message}</HelperText>
                )}
              </>
            )}
          />

          <Controller
            control={control}
            name="cardHolder"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Cardholder Name *"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.cardHolder}
                  style={styles.input}
                  mode="outlined"
                  autoCapitalize="words"
                />
                {errors.cardHolder && (
                  <HelperText type="error">{errors.cardHolder.message}</HelperText>
                )}
              </>
            )}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="expiryDate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <TextInput
                      label="Expiry (MM/YY) *"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.expiryDate}
                      style={styles.input}
                      mode="outlined"
                      keyboardType="numeric"
                      maxLength={5}
                      placeholder="MM/YY"
                    />
                    {errors.expiryDate && (
                      <HelperText type="error">{errors.expiryDate.message}</HelperText>
                    )}
                  </>
                )}
              />
            </View>

            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="cvv"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <TextInput
                      label="CVV *"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.cvv}
                      style={styles.input}
                      mode="outlined"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                    {errors.cvv && <HelperText type="error">{errors.cvv.message}</HelperText>}
                  </>
                )}
              />
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
            style={styles.button}
            icon="lock"
          >
            Pay ${invoice.amount.toFixed(2)}
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.button}
          >
            Cancel
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
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginVertical: 8,
  },
  input: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfWidth: {
    flex: 1,
  },
  button: {
    marginTop: 16,
  },
});
