import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type {
  BuildingsStackParamList,
  FinanceStackParamList,
  CommunicationStackParamList,
} from '../types/navigation';

// Type-safe navigation hooks for each stack
export const useBuildingsNavigation = () =>
  useNavigation<NativeStackNavigationProp<BuildingsStackParamList>>();

export const useFinanceNavigation = () =>
  useNavigation<NativeStackNavigationProp<FinanceStackParamList>>();

export const useCommunicationNavigation = () =>
  useNavigation<NativeStackNavigationProp<CommunicationStackParamList>>();
