import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BuildingsStackParamList } from '../../types/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { buildingsApi } from '@horizon-hcm/shared/src/api/buildings';

const buildingSchema = z.object({
  name: z.string().min(1, 'Building name is required'),
  address: z.string().min(1, 'Address is required'),
  yearBuilt: z.string().optional(),
});

type BuildingFormData = z.infer<typeof buildingSchema>;

type Props = NativeStackScreenProps<BuildingsStackParamList, 'BuildingForm'>;

export default function BuildingFormScreen({ route, navigation }: Props) {
  const { building } = route.params || {};
  const [loading, setLoading] = useState(false);

  const formatAddressForForm = (address: unknown): string => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address !== null) {
      return JSON.stringify(address);
    }
    return '';
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: building?.name || '',
      address: formatAddressForForm(building?.address) || '',
      yearBuilt: building?.yearBuilt?.toString() || '',
    },
  });

  const onSubmit = async (data: BuildingFormData) => {
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        address: data.address,
        yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt) : undefined,
      };
      if (building?.id) {
        await buildingsApi.update(building.id, payload);
      } else {
        await buildingsApi.create(payload);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving building:', error);
      Alert.alert('Error', 'Failed to save building. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Building Name *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.name}
              style={styles.input}
              mode="outlined"
            />
            {errors.name && <HelperText type="error">{errors.name.message}</HelperText>}
          </>
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Address *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.address}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            {errors.address && <HelperText type="error">{errors.address.message}</HelperText>}
          </>
        )}
      />

      <Controller
        control={control}
        name="yearBuilt"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Year Built"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.yearBuilt}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            {errors.yearBuilt && <HelperText type="error">{errors.yearBuilt.message}</HelperText>}
          </>
        )}
      />

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        {building ? 'Update Building' : 'Create Building'}
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
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
});
