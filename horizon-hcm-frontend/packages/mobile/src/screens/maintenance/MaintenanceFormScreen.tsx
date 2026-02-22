import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Image } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField, SelectField } from '../../components';

const maintenanceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  priority: z.string().min(1, 'Priority is required'),
  location: z.string().min(1, 'Location is required'),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

type Props = NativeStackScreenProps<CommunicationStackParamList, 'MaintenanceForm'>;

const categories = [
  { label: 'Plumbing', value: 'Plumbing' },
  { label: 'Electrical', value: 'Electrical' },
  { label: 'HVAC', value: 'HVAC' },
  { label: 'Structural', value: 'Structural' },
  { label: 'Cleaning', value: 'Cleaning' },
  { label: 'Other', value: 'Other' },
];

const priorities = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

export default function MaintenanceFormScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priority: 'normal',
      location: '',
    },
  });

  const onSubmit = async (data: MaintenanceFormData) => {
    setLoading(true);
    try {
      // TODO: Call API to create maintenance request
      console.log('Maintenance request:', data, 'Photos:', photos);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating maintenance request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = () => {
    // TODO: Implement camera/gallery picker
    console.log('Add photo');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.container}>
      <FormField
        control={control}
        name="title"
        label="Title *"
        error={errors.title?.message}
        style={styles.input}
        disabled={loading}
      />

      <FormField
        control={control}
        name="description"
        label="Description *"
        error={errors.description?.message}
        style={styles.input}
        multiline
        numberOfLines={4}
        disabled={loading}
      />

      <SelectField
        control={control}
        name="category"
        label="Category *"
        options={categories}
        error={errors.category?.message}
        setValue={setValue}
        disabled={loading}
      />

      <SelectField
        control={control}
        name="priority"
        label="Priority *"
        options={priorities}
        error={errors.priority?.message}
        setValue={setValue}
        disabled={loading}
      />

      <FormField
        control={control}
        name="location"
        label="Location *"
        error={errors.location?.message}
        style={styles.input}
        disabled={loading}
      />

      <View style={styles.photoSection}>
        <Button
          mode="outlined"
          icon="camera"
          onPress={handleAddPhoto}
          disabled={photos.length >= 5 || loading}
          style={styles.photoButton}
        >
          Add Photos ({photos.length}/5)
        </Button>

        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <IconButton
                  icon="close-circle"
                  size={24}
                  onPress={() => handleRemovePhoto(index)}
                  style={styles.removeButton}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Submit Request
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
  photoSection: {
    marginVertical: 16,
  },
  photoButton: {
    marginBottom: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    margin: 0,
  },
  button: {
    marginTop: 16,
  },
});
