import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Avatar } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@horizon-hcm/shared/src/store/auth.store';
import { usersApi } from '@horizon-hcm/shared/src/api/users';
import { showImagePickerOptions } from '../../utils/camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'ProfileEdit'>;

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
}

export default function ProfileEditScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const queryClient = useQueryClient();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => usersApi.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update profile');
    },
  });

  const handleAvatarPress = async () => {
    const result = await showImagePickerOptions();
    if (result) {
      setAvatarUri(result.uri);
      // TODO: Upload avatar to server
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarContainer}>
        {avatarUri ? (
          <Avatar.Image size={100} source={{ uri: avatarUri }} />
        ) : (
          <Avatar.Text size={100} label={getInitials(user?.name || 'U')} />
        )}
        <Button mode="text" onPress={handleAvatarPress} style={styles.changeAvatarButton}>
          Change Photo
        </Button>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Full Name"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.name}
              disabled={isLoading}
              style={styles.input}
            />
          )}
        />
        {errors.name && <View style={styles.errorText}>{errors.name.message}</View>}

        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Email"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={isLoading}
              style={styles.input}
            />
          )}
        />
        {errors.email && <View style={styles.errorText}>{errors.email.message}</View>}

        <Controller
          control={control}
          name="phone"
          rules={{ required: 'Phone is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Phone"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.phone}
              keyboardType="phone-pad"
              disabled={isLoading}
              style={styles.input}
            />
          )}
        />
        {errors.phone && <View style={styles.errorText}>{errors.phone.message}</View>}

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={updateMutation.isPending}
          disabled={updateMutation.isPending}
          style={styles.button}
        >
          Save Changes
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          disabled={updateMutation.isPending}
          style={styles.button}
        >
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  avatarContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  changeAvatarButton: {
    marginTop: 8,
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
});
