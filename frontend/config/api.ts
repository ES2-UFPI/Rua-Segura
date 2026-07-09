import Constants from 'expo-constants';
import { Platform } from 'react-native';

const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const webHost =
	typeof window !== 'undefined' && window.location?.hostname
		? window.location.hostname
		: null;
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const apiHost = webHost ?? expoHost ?? fallbackHost;

export const API_URL =
	process.env.EXPO_PUBLIC_API_URL ??
	`http://${apiHost}:8000`;

console.log('HOST URI:', Constants.expoConfig?.hostUri);
console.log('API URL:', API_URL);
