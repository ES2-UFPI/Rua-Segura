import React, { useMemo, useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSharedRouteTracking } from '@/hooks/useSharedRouteTracking';

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    Polyline = RNMaps.Polyline;
  } catch {}
}

interface Props {
  token: string;
}

export default function SharedRouteTrackingScreen({ token }: Props) {
  const router = useRouter();
  const nativeMapRef = useRef<any>(null);
  
  const { loading, error, session } = useSharedRouteTracking(token);
  const routeLineCoordinates = useMemo(() => {
    if (!session) return [];

    return session.routeCoordinates && session.routeCoordinates.length > 1
      ? session.routeCoordinates
      : [session.origin, session.currentLocation, session.destination];
  }, [session]);

  // Estados e referências para controle do mapa Web (Leaflet)
  const webMapId = `share-tracking-map-${token}`;
  const webMapRef = useRef<any>(null);
  const webMarkersRef = useRef<any[]>([]);
  const webPolylineRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Efeito para carregar e iniciar o mapa Leaflet na Web
  useEffect(() => {
    if (Platform.OS !== 'web' || !session) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L) return;

      const container = document.getElementById(webMapId);
      if (!container) return;

      if ((container as any)._leaflet_map) {
        (container as any)._leaflet_map.remove();
      }

      const map = L.map(webMapId, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
      }).setView([session.currentLocation.latitude, session.currentLocation.longitude], 15);

      (container as any)._leaflet_map = map;
      webMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      setLeafletLoaded(true);
    };

    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      const container = document.getElementById(webMapId);
      if (container && (container as any)._leaflet_map) {
        (container as any)._leaflet_map.remove();
        (container as any)._leaflet_map = null;
      }
      webMapRef.current = null;
    };
  }, [webMapId, session !== null]);

  // Atualiza marcadores e polylines na Web ao mudar os dados do mock/polling
  useEffect(() => {
    if (Platform.OS !== 'web' || !webMapRef.current || !session) return;
    const L = (window as any).L;
    if (!L) return;

    const map = webMapRef.current;

    // Limpa marcadores anteriores
    webMarkersRef.current.forEach((m) => m.remove());
    webMarkersRef.current = [];

    const createDotIcon = (color: string) =>
      L.divIcon({
        className: 'route-dot-icon',
        html: `<div style="background-color:${color}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 6px rgba(0,0,0,0.35);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

    // Marcador da Origem
    const originMarker = L.marker([session.origin.latitude, session.origin.longitude], {
      icon: createDotIcon('#062b55'),
    }).addTo(map).bindPopup('<b>Origem do Trajeto</b>');

    // Marcador do Destino
    const destMarker = L.marker([session.destination.latitude, session.destination.longitude], {
      icon: createDotIcon('#10b981'),
    }).addTo(map).bindPopup('<b>Destino do Trajeto</b>');

    // Marcador da Posição Atual
    const currentMarker = L.marker([session.currentLocation.latitude, session.currentLocation.longitude], {
      icon: L.divIcon({
        className: 'current-loc-pulse',
        html: `<div style="background-color:#2dd4bf; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(45,212,191,0.8);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    }).addTo(map).bindPopup('<b>Localização Atual do Usuário</b>');

    webMarkersRef.current.push(originMarker, destMarker, currentMarker);

    if (webPolylineRef.current) {
      webPolylineRef.current.remove();
    }

    // Desenha trajeto
    webPolylineRef.current = L.polyline(routeLineCoordinates.map((coord) => [
      coord.latitude,
      coord.longitude,
    ]), {
      color: '#10b981',
      weight: 4,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Pan para nova posição atual
    map.panTo([session.currentLocation.latitude, session.currentLocation.longitude]);
  }, [session, leafletLoaded, routeLineCoordinates]);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--:--:--';
    }
  };

  const recenterMap = () => {
    if (!session) return;

    if (Platform.OS === 'web' && webMapRef.current) {
      webMapRef.current.setView([session.currentLocation.latitude, session.currentLocation.longitude], 15);
    } else if (Platform.OS !== 'web' && nativeMapRef.current) {
      nativeMapRef.current.animateToRegion({
        latitude: session.currentLocation.latitude,
        longitude: session.currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.004,
      }, 1000);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2dd4bf" />
        <Text style={styles.loadingText}>Carregando trajeto...</Text>
      </View>
    );
  }

  // Trata erros de domínio (Invalid / Expired / Ended)
  if (error === 'INVALID' || error === 'EXPIRED' || session?.status === 'ended') {
    const isEnded = session?.status === 'ended';
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons 
          name={isEnded ? "checkmark-circle-outline" : error === 'EXPIRED' ? "hourglass-outline" : "alert-circle-outline"} 
          size={64} 
          color={isEnded ? "#10b981" : error === 'EXPIRED' ? "#f59e0b" : "#ef4444"} 
        />
        <Text style={styles.errorTitle}>
          {isEnded ? "Compartilhamento Encerrado" : error === 'EXPIRED' ? "Link Expirado" : "Link Inválido"}
        </Text>
        <Text style={styles.errorDescription}>
          {isEnded 
            ? "O trajeto foi concluído ou o compartilhamento foi encerrado pelo usuário." 
            : error === 'EXPIRED' 
            ? "Este link expirou devido ao limite de tempo de compartilhamento." 
            : "O link de compartilhamento fornecido é inválido ou não existe."}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>Voltar para o Início</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initialRegion = session ? {
    latitude: session.currentLocation.latitude,
    longitude: session.currentLocation.longitude,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
  } : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Premium */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.replace('/')}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Acompanhar Trajeto</Text>
          <Text style={styles.headerSubtitle}>Token: {token}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Ao Vivo</Text>
        </View>
      </View>

      {/* Área do Mapa */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' || !MapView ? (
          <div id={webMapId} style={{ width: '100%', height: '100%', outline: 'none' }} />
        ) : (
          <MapView
            ref={nativeMapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={session!.origin}
              title="Origem"
              pinColor="#062b55"
            />
            <Marker
              coordinate={session!.currentLocation}
              title="Localização Atual"
              description={`Última atualização: ${formatTime(session!.lastUpdatedAt)}`}
              pinColor="#2dd4bf"
            />
            <Marker
              coordinate={session!.destination}
              title="Destino"
              pinColor="#10b981"
            />
            <Polyline
              coordinates={routeLineCoordinates}
              strokeColor="#10b981"
              strokeWidth={4}
            />
          </MapView>
        )}

        {/* Botão flutuante de Recenter */}
        <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
          <Ionicons name="locate" size={24} color="#2dd4bf" />
        </TouchableOpacity>
      </View>

      {/* Painel inferior de Informações */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="navigate-circle-outline" size={28} color="#2dd4bf" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Destino do Usuário</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              Lat: {session?.destination.latitude.toFixed(5)} | Lng: {session?.destination.longitude.toFixed(5)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={24} color="#94a3b8" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Última atualização de localização</Text>
            <Text style={styles.infoValue}>
              {session ? formatTime(session.lastUpdatedAt) : '--:--:--'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  loadingText: {
    color: '#cbd5e1',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: {
    color: '#2dd4bf',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    height: 70,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  headerBackBtn: {
    marginRight: 14,
    padding: 4,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#1e293b',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1000,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#334155',
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 14,
  },
});
