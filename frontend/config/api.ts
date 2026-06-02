import Constants from 'expo-constants';
import { Platform } from 'react-native';

const host = Constants.expoConfig?.hostUri?.split(':')[0];
const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_URL = `http://${host ?? fallbackHost}:8000`;