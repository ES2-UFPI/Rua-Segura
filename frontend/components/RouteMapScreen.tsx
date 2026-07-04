import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams} from 'expo-router';

type RouteCoordinates = {
  latitude: number;
  longitude: number;
};

type RouteMapParams = {
  originName?: string;
  destinationName?: string;
  originLatitude?: string;
  originLongitude?: string;
  destinationLatitude?: string;
  destinationLongitude?: string;
};

const FALLBACK_ORIGIN: RouteCoordinates = {
  latitude: -5.0836,
  longitude: -42.7934,
};

const FALLBACK_DESTINATION: RouteCoordinates = {
  latitude: -5.0805,
  longitude: -42.7901,
};

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    Polyline = RNMaps.Polyline;
  } catch (error) {
    console.warn('Falha ao carregar react-native-maps:', error);
  }
}

function parseCoord(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number(value);

  return Number.isNaN(parsed) ? fallback : parsed;
}

function createMockRouteLine(
  origin: RouteCoordinates,
  destination: RouteCoordinates,
): RouteCoordinates[] {
  // Rota mockada apenas para preparar a tela.
  // A linha real será substituída futuramente pela rota calculada pela API.
  return [
    origin,
    {
      latitude: origin.latitude + 0.0012,
      longitude: origin.longitude + 0.001,
    },
    {
      latitude: origin.latitude + 0.002,
      longitude: origin.longitude + 0.0024,
    },
    {
      latitude: destination.latitude - 0.0008,
      longitude: destination.longitude - 0.0006,
    },
    destination,
  ];
}

type RouteSummaryCardProps = {
  originName: string;
  destinationName: string;
};

function RouteSummaryCard({
  originName,
  destinationName,
}: RouteSummaryCardProps) {
  return (
    <View style={styles.routeSummaryCard}>
      <View style={styles.summaryTopRow}>
        <View>
          <Text style={styles.summaryTitle}>Rota recomendada</Text>
          <Text style={styles.summaryDistance}>2,4 km • 8 min</Text>
        </View>

        <View style={styles.riskBadge}>
          <Text style={styles.riskBadgeText}>Baixo risco</Text>
        </View>
      </View>

      <View style={styles.routePointsBox}>
        <View style={styles.routeDotsColumn}>
          <View style={styles.originDot} />
          <View style={styles.dotsLine} />
          <View style={styles.destinationDot} />
        </View>

        <View style={styles.routeNames}>
          <Text style={styles.routeOriginText} numberOfLines={1}>
            {originName}
          </Text>
          <Text style={styles.routeDestText} numberOfLines={1}>
            {destinationName}
          </Text>
        </View>
      </View>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonTitle}>Por que essa rota?</Text>

        <Text style={styles.reasonText}>
          Esta rota evita áreas com maior concentração de ocorrências e prioriza
          vias mais iluminadas.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.startRouteButton}
        activeOpacity={0.85}
        onPress={() => console.log('Iniciar rota em implementação')}
      >
        <Text style={styles.startRouteButtonText}>Iniciar rota</Text>
      </TouchableOpacity>

      {/*
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() =>
          router.push({
            pathname: '/route-alternatives',
            params: {
              originName,
              destinationName,
            },
          })
        }
      >
        <Text style={styles.alternativesLink}>Ver alternativas</Text>
      </TouchableOpacity>
      */}
    </View>
  );
}

export default function RouteMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteMapParams>();

  const originName = params.originName ?? '';
  const destinationName = params.destinationName ?? '';

  const hasOriginCoords =
    params.originLatitude != null && params.originLongitude != null;

  const hasDestinationCoords =
    params.destinationLatitude != null && params.destinationLongitude != null;

  const originCoords: RouteCoordinates | null = hasOriginCoords
    ? {
        latitude: parseCoord(params.originLatitude, FALLBACK_ORIGIN.latitude),
        longitude: parseCoord(
          params.originLongitude,
          FALLBACK_ORIGIN.longitude,
        ),
      }
    : null;

  const destinationCoords: RouteCoordinates | null = hasDestinationCoords
    ? {
        latitude: parseCoord(
          params.destinationLatitude,
          FALLBACK_DESTINATION.latitude,
        ),
        longitude: parseCoord(
          params.destinationLongitude,
          FALLBACK_DESTINATION.longitude,
        ),
      }
    : null;

  const hasRouteData =
    originName.trim().length > 0 && destinationName.trim().length > 0;

  const initialOrigin = originCoords ?? FALLBACK_ORIGIN;
  const initialDestination = destinationCoords ?? FALLBACK_DESTINATION;

  const routeLineCoords = createMockRouteLine(initialOrigin, initialDestination);

  const mapInitialRegion = {
    latitude: (initialOrigin.latitude + initialDestination.latitude) / 2,
    longitude: (initialOrigin.longitude + initialDestination.longitude) / 2,
    latitudeDelta:
      Math.abs(initialOrigin.latitude - initialDestination.latitude) * 3 + 0.01,
    longitudeDelta:
      Math.abs(initialOrigin.longitude - initialDestination.longitude) * 3 +
      0.01,
  };

  const isWeb = Platform.OS === 'web';
  const webMapId = 'route-map-leaflet';

  const webMapRef = useRef<any>(null);
  const webMarkersRef = useRef<any[]>([]);
  const webPolylineRef = useRef<any>(null);
  const nativeMapRef = useRef<any>(null);

  useEffect(() => {
    if (!isWeb || !hasRouteData) return;

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

      const center: [number, number] = [
        mapInitialRegion.latitude,
        mapInitialRegion.longitude,
      ];

      const map = L.map(webMapId, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, 14);

      (container as any)._leaflet_map = map;
      webMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '\u00a9 OpenStreetMap contributors',
      }).addTo(map);

      webMarkersRef.current.forEach((marker) => marker.remove());
      webMarkersRef.current = [];

      const originIcon = L.divIcon({
        className: 'origin-icon',
        html: '<div style="background-color:#16A34A;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px rgba(0,0,0,0.35);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const destinationIcon = L.divIcon({
        className: 'destination-icon',
        html: '<div style="background-color:#2563EB;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px rgba(0,0,0,0.35);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const originMarker = L.marker(
        [initialOrigin.latitude, initialOrigin.longitude],
        { icon: originIcon },
      )
        .addTo(map)
        .bindPopup(`<b>Origem</b><br/>${originName}`);

      const destinationMarker = L.marker(
        [initialDestination.latitude, initialDestination.longitude],
        { icon: destinationIcon },
      )
        .addTo(map)
        .bindPopup(`<b>Destino</b><br/>${destinationName}`);

      webMarkersRef.current.push(originMarker, destinationMarker);

      if (webPolylineRef.current) {
        webPolylineRef.current.remove();
        webPolylineRef.current = null;
      }

      webPolylineRef.current = L.polyline(
        routeLineCoords.map((coord) => [coord.latitude, coord.longitude]),
        {
          color: '#16A34A',
          weight: 5,
          opacity: 0.85,
        },
      ).addTo(map);

      const bounds = L.latLngBounds(
        routeLineCoords.map((coord) => [coord.latitude, coord.longitude]),
      );

      map.fitBounds(bounds, {
        padding: [48, 48],
      });

      setTimeout(() => map.invalidateSize(), 100);
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
      webMarkersRef.current.forEach((marker) => marker.remove());
      webMarkersRef.current = [];

      if (webPolylineRef.current) {
        webPolylineRef.current.remove();
        webPolylineRef.current = null;
      }

      const container = document.getElementById(webMapId);

      if (container && (container as any)._leaflet_map) {
        (container as any)._leaflet_map.remove();
        (container as any)._leaflet_map = null;
      }

      webMapRef.current = null;
    };
  }, [
    isWeb,
    hasRouteData,
    originName,
    destinationName,
    initialOrigin.latitude,
    initialOrigin.longitude,
    initialDestination.latitude,
    initialDestination.longitude,
  ]);

  if (!hasRouteData) {
    return (
      <SafeAreaView style={styles.emptySafeArea} edges={['top']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#062B55"
          translucent={false}
        />

        <View style={styles.emptyScreen}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerIconButton}
              accessibilityLabel="Voltar"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Rota recomendada</Text>

            <View style={styles.headerIconButton} />
          </View>

          <View style={styles.emptyContent}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="map-outline" size={48} color="#94A3B8" />
            </View>

            <Text style={styles.emptyTitle}>Nenhuma rota encontrada</Text>

            <Text style={styles.emptyDescription}>
              Volte e informe a origem e o destino para visualizar a rota no
              mapa.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color="#FFFFFF"
                style={styles.emptyButtonIcon}
              />

              <Text style={styles.emptyButtonText}>Buscar nova rota</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isWeb) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#062B55"
          translucent={false}
        />

        <View style={styles.screen}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerIconButton}
              accessibilityLabel="Voltar"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Rota recomendada</Text>

            <View style={styles.headerIconButton} />
          </View>

          <View style={styles.mapArea}>
            <View style={styles.webMapContainer}>
              <View nativeID={webMapId} style={styles.webMap} />
            </View>

            <RouteSummaryCard
              originName={originName}
              destinationName={destinationName}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!MapView) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#062B55"
          translucent={false}
        />

        <View style={styles.screen}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerIconButton}
              accessibilityLabel="Voltar"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Rota recomendada</Text>

            <View style={styles.headerIconButton} />
          </View>

          <View style={styles.mapArea}>
            <View style={styles.mapFallback}>
              <Ionicons name="map-outline" size={48} color="#94A3B8" />
              <Text style={styles.mapFallbackText}>Carregando mapa...</Text>
            </View>

            <RouteSummaryCard
              originName={originName}
              destinationName={destinationName}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#062B55"
        translucent={false}
      />

      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIconButton}
            accessibilityLabel="Voltar"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Rota recomendada</Text>

          <View style={styles.headerIconButton} />
        </View>

        <View style={styles.mapArea}>
          <MapView
            ref={nativeMapRef}
            style={styles.map}
            initialRegion={mapInitialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            toolbarEnabled={false}
          >
            <Polyline
              coordinates={routeLineCoords}
              strokeColor="#16A34A"
              strokeWidth={5}
            />

            <Marker
              coordinate={initialOrigin}
              title="Origem"
              description={originName}
              pinColor="#16A34A"
            />

            <Marker
              coordinate={initialDestination}
              title="Destino"
              description={destinationName}
              pinColor="#2563EB"
            />
          </MapView>

          <RouteSummaryCard
            originName={originName}
            destinationName={destinationName}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#062B55',
  },

  screen: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  header: {
    backgroundColor: '#062B55',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  headerIconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  mapArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E5EAF0',
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  webMapContainer: {
    flex: 1,
    backgroundColor: '#E5EAF0',
  },

  webMap: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  mapFallback: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapFallbackText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },

  mapActions: {
    position: 'absolute',
    right: 14,
    top: 16,
    gap: 10,
  },

  mapActionButton: {
    width: 64,
    minHeight: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 5,
  },

  mapActionText: {
    color: '#102A56',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },

  routeSummaryCard: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 7,
  },

  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  summaryTitle: {
    color: '#102A56',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },

  summaryDistance: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },

  riskBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  riskBadgeText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '800',
  },

  routePointsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    marginBottom: 12,
  },

  routeDotsColumn: {
    alignItems: 'center',
    marginRight: 12,
  },

  originDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#16A34A',
  },

  dotsLine: {
    width: 2,
    height: 20,
    backgroundColor: '#CBD5E1',
    marginVertical: 3,
  },

  destinationDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },

  routeNames: {
    flex: 1,
  },

  routeOriginText: {
    color: '#102A56',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 11,
  },

  routeDestText: {
    color: '#102A56',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 11,
  },

  reasonBox: {
    marginBottom: 14,
  },

  reasonTitle: {
    color: '#102A56',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },

  reasonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginBottom: 7,
  },

  detailsLink: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },

  startRouteButton: {
    height: 46,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  startRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  alternativesLink: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },

  emptySafeArea: {
    flex: 1,
    backgroundColor: '#062B55',
  },

  emptyScreen: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  emptyTitle: {
    color: '#102A56',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptyDescription: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },

  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#16A34A',
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  emptyButtonIcon: {
    marginRight: 8,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
   logoText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    marginLeft: 4,
    textAlign: 'center',
  },

  logoTextHighlight: {
    color: '#22C55E',
  },
});