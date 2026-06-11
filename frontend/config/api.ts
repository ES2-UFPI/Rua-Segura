import Constants from 'expo-constants';
import { Platform } from 'react-native';

const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_URL =
	process.env.EXPO_PUBLIC_API_URL ??
	`http://${Constants.expoConfig?.hostUri?.split(':')[0] ?? fallbackHost}:8000`;

console.log('HOST URI:', Constants.expoConfig?.hostUri);
console.log('API URL:', API_URL);