import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BuildingsStackParamList } from '../../types/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField, SelectField } from '../../components';

const residentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  role: z.enum(['owner', 'tenant']),
  moveInDate: z.string().optional(),
});

type ResidentFormData = z.infer<typeof residentSchema>;

type Props = NativeStackScreenProps<BuildingsStackParamList, 'ResidentForm'>;

export default function ResidentFormScreen({ route, navigation }: Props) {
  const { resident, apartmentId } = route.params || {};
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResidentFormData>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      name: resident?.name || '',
      email: resident?.email || '',
      phone: resident?.phone || '',
      role: (resident?.role as 'owner' | 'tenant') || 'tenant',
      moveInDate: resident?.moveInDate || '',
    },
  });

  const onSubmit = async (data: ResidentFormData) => {
    setLoading(true);
    try {
      // TODO: Call API to create/update resident
      console.log('Resident data:', data, 'Apartment ID:', apartmentId);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving resident:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <FormField
        control={control}
        name="name"
        label="Full Name *"
        error={errors.name?.message}
      />

      <FormField
        control={control}
        name="email"
        label="Email *"
        error={errors.email?.message}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <FormField
        control={control}
        name="phone"
        label="Phone *"
        error={errors.phone?.message}
        keyboardType="phone-pad"
      />

      <SelectField
        control={control}
        name="role"
        label="Role *"
        error={errors.role?.message}
        options={[
          { label: 'Owner', value: 'owner' },
          { label: 'Tenant', value: 'tenant' },
        ]}
      />

      <FormField
        control={control}
        name="moveInDate"
        label="Move-in Date"
        error={errors.moveInDate?.message}
        placeholder="YYYY-MM-DD"
      />

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        {resident ? 'Update Resident' : 'Add Resident'}
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        disabled={loading}
        style={styles.button}
      >
        Cancel
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 16,
  },
});
