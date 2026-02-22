import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, Menu, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const maintenanceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  priority: z.string().min(1, 'Priority is required'),
  location: z.string().min(1, 'Location is required'),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

type Props = NativeStackScreenProps<CommunicationStackParamList, 'MaintenanceForm'>;

const categories = ['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Cleaning', 'Other'];
const priorities = ['low', 'normal', 'high', 'urgent'];

export default function MaintenanceFormScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);

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
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Title *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.title}
              style={styles.input}
              mode="outlined"
            />
            {errors.title && <HelperText type="error">{errors.title.message}</HelperText>}
          </>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Description *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.description}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
            />
            {errors.description && (
              <HelperText type="error">{errors.description.message}</HelperText>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field: { value } }) => (
          <>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <TouchableOpacity onPress={() => setCategoryMenuVisible(true)}>
                  <TextInput
                    label="Category *"
                    value={value}
                    editable={false}
                    error={!!errors.category}
                    style={styles.input}
                    mode="outlined"
                    right={<TextInput.Icon icon="chevron-down" />}
                  />
                </TouchableOpacity>
              }
            >
              {categories.map((cat) => (
                <Menu.Item
                  key={cat}
                  onPress={() => {
                    setValue('category', cat);
                    setCategoryMenuVisible(false);
                  }}
                  title={cat}
                />
              ))}
            </Menu>
            {errors.category && <HelperText type="error">{errors.category.message}</HelperText>}
          </>
        )}
      />

      <Controller
        control={control}
        name="priority"
        render={({ field: { value } }) => (
          <>
            <Menu
              visible={priorityMenuVisible}
              onDismiss={() => setPriorityMenuVisible(false)}
              anchor={
                <TouchableOpacity onPress={() => setPriorityMenuVisible(true)}>
                  <TextInput
                    label="Priority *"
                    value={value}
                    editable={false}
                    error={!!errors.priority}
                    style={styles.input}
                    mode="outlined"
                    right={<TextInput.Icon icon="chevron-down" />}
                  />
                </TouchableOpacity>
              }
            >
              {priorities.map((pri) => (
                <Menu.Item
                  key={pri}
                  onPress={() => {
                    setValue('priority', pri);
                    setPriorityMenuVisible(false);
                  }}
                  title={pri.charAt(0).toUpperCase() + pri.slice(1)}
                />
              ))}
            </Menu>
            {errors.priority && <HelperText type="error">{errors.priority.message}</HelperText>}
          </>
        )}
      />

      <Controller
        control={control}
        name="location"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Location *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.location}
              style={styles.input}
              mode="outlined"
            />
            {errors.location && <HelperText type="error">{errors.location.message}</HelperText>}
          </>
        )}
      />

      <View style={styles.photoSection}>
        <Button
          mode="outlined"
          icon="camera"
          onPress={handleAddPhoto}
          disabled={photos.length >= 5}
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
