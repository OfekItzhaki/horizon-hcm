import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BuildingsStackParamList } from '../../types/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField, SelectField } from '../../components';

const apartmentSchema = z.object({
  number: z.string().min(1, 'Apartment number is required'),
  floor: z.string().min(1, 'Floor is required'),
  size: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  occupancyStatus: z.enum(['occupied', 'vacant', 'maintenance']),
});

type ApartmentFormData = z.infer<typeof apartmentSchema>;

type Props = NativeStackScreenProps<BuildingsStackParamList, 'ApartmentForm'>;

export default function ApartmentFormScreen({ route, navigation }: Props) {
  const { apartment, buildingId } = route.params || {};
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: {
      number: apartment?.number || '',
      floor: apartment?.floor?.toString() || '',
      size: apartment?.size?.toString() || '',
      bedrooms: apartment?.bedrooms?.toString() || '',
      bathrooms: apartment?.bathrooms?.toString() || '',
      occupancyStatus: (apartment?.occupancyStatus as 'occupied' | 'vacant' | 'maintenance') || 'vacant',
    },
  });

  const onSubmit = async (data: ApartmentFormData) => {
    setLoading(true);
    try {
      // TODO: Call API to create/update apartment
      console.log('Apartment data:', data, 'Building ID:', buildingId);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving apartment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <FormField
        control={control}
        name="number"
        label="Apartment Number *"
        error={errors.number?.message}
      />

      <FormField
        control={control}
        name="floor"
        label="Floor *"
        error={errors.floor?.message}
        keyboardType="numeric"
      />

      <FormField
        control={control}
        name="size"
        label="Size (sq ft)"
        error={errors.size?.message}
        keyboardType="numeric"
      />

      <FormField
        control={control}
        name="bedrooms"
        label="Bedrooms"
        error={errors.bedrooms?.message}
        keyboardType="numeric"
      />

      <FormField
        control={control}
        name="bathrooms"
        label="Bathrooms"
        error={errors.bathrooms?.message}
        keyboardType="numeric"
      />

      <SelectField
        control={control}
        name="occupancyStatus"
        label="Occupancy Status *"
        error={errors.occupancyStatus?.message}
        options={[
          { label: 'Occupied', value: 'occupied' },
          { label: 'Vacant', value: 'vacant' },
          { label: 'Maintenance', value: 'maintenance' },
        ]}
      />

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        {apartment ? 'Update Apartment' : 'Create Apartment'}
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
