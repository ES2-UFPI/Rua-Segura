import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Image, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BaseScreenProps {
  children: React.ReactNode;
}

export default function BaseScreen({ children }: BaseScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const routeIcon = require('../assets/images/route.png');

  // Determine active tab based on pathname
  const isMapaActive = pathname === '/' || pathname === '/index' || pathname === '' || pathname.includes('(tabs)');
  const isRotasActive = pathname.startsWith('/route-search') || pathname.startsWith('/route-map') || pathname.startsWith('/active-route');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>

      {/* Reusable Bottom Tab Bar */}
      <View style={[
        styles.bottomTabBar, 
        { paddingBottom: Platform.OS === 'web' ? 10 : Math.max(insets.bottom, 12) }
      ]}>
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => router.push('/')}
        >
          <Ionicons name="map" size={15} color={isMapaActive ? '#3B9B6E' : '#B8C9DB'} />
          <Text style={[styles.tabText, isMapaActive && styles.tabTextActive]}>Mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => router.push('/route-search')}
        >
          <Image
            source={routeIcon}
            style={[styles.tabIconImage, { tintColor: isRotasActive ? '#3B9B6E' : '#B8C9DB' }]}
            resizeMode="contain"
          />
          <Text style={[styles.tabText, isRotasActive && styles.tabTextActive]}>Rotas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
        >
          <Ionicons name="person" size={15} color="#B8C9DB" />
          <Text style={styles.tabText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A3550',
  },
  content: {
    flex: 1,
  },
  bottomTabBar: {
    backgroundColor: '#1A3550',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 5,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 100,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  tabIconImage: {
    width: 15,
    height: 15,
  },
  tabText: {
    color: '#B8C9DB',
    fontSize: 10,
    fontWeight: '400',
    marginTop: 2,
  },
  tabTextActive: {
    color: '#3B9B6E',
  },
});
