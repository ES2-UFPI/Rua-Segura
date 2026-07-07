import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShareTrip } from '@/hooks/useShareTrip';
import { SafetyResourcesSheet } from '@/components/SafetyResourcesSheet';
import { ShareSession } from '@/services/shareService';

type RouteCoordinates = {
  latitude: number;
  longitude: number;
};

type NavigationManeuver = 'straight' | 'left' | 'right' | 'arrive';

type NavigationStep = {
  instruction: string;
  streetName: string;
  nextInstruction: string;
  distance: string;
  maneuver: NavigationManeuver;
};

type ActiveRouteParams = {
  originName?: string;
  destinationName?: string;
  originLatitude?: string;
  originLongitude?: string;
  destinationLatitude?: string;
  destinationLongitude?: string;
  estimatedTime?: string;
  totalDistance?: string;
  riskLevel?: string;
  routeCoordinatesJson?: string;
  stepsJson?: string;
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const COLORS = {
  primaryGreen: '#16A34A',
  primaryBlue: '#062B55',
  white: '#FFFFFF',
  background: '#E5EAF0',
  textDark: '#273142',
  textMuted: '#697586',
  danger: '#DC2626',
  warning: '#B45309',
  route: '#16A34A',
};

const FALLBACK_TIME = '8 min';
const FALLBACK_DISTANCE = '2,4 km';
const FALLBACK_RISK = 'Baixo';
const ANDROID_NAV_FALLBACK_BOTTOM = 42;

const MARKER_DOT_GREEN = require('../assets/images/marker-dot-green.png');
const USER_LOCATION_MARKER = require('../assets/images/user-location.png');

const MOCK_USER_POSITION: RouteCoordinates = {
  latitude: -5.0836,
  longitude: -42.7934,
};

const FALLBACK_DESTINATION: RouteCoordinates = {
  latitude: -5.0805,
  longitude: -42.7901,
};


const MOCK_ACTIVE_ROUTE = {
  currentStepIndex: 0,
  estimatedTime: FALLBACK_TIME,
  totalDistance: FALLBACK_DISTANCE,
  currentRisk: FALLBACK_RISK,
  steps: [
    {
      instruction: 'Siga em frente',
      streetName: 'Rua das Acácias',
      nextInstruction: 'Depois, vire à direita',
      distance: '450 m',
      maneuver: 'straight' as NavigationManeuver,
    },
    {
      instruction: 'Vire à direita',
      streetName: 'Av. Raul Lopes',
      nextInstruction: 'Depois, siga por 1 km',
      distance: '120 m',
      maneuver: 'right' as NavigationManeuver,
    },
  ],
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

function isValidCoordinate(coord: RouteCoordinates) {
  return (
    Number.isFinite(coord.latitude) &&
    Number.isFinite(coord.longitude) &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
}

function parseRouteCoordinatesFromJson(
  value?: string,
): RouteCoordinates[] | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) return null;

    const coordinates = parsed
      .map((item): RouteCoordinates | null => {
        if (
          Array.isArray(item) &&
          item.length >= 2 &&
          Number.isFinite(Number(item[0])) &&
          Number.isFinite(Number(item[1]))
        ) {
          return {
            longitude: Number(item[0]),
            latitude: Number(item[1]),
          };
        }

        if (
          item &&
          typeof item === 'object' &&
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude))
        ) {
          return {
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
          };
        }

        return null;
      })
      .filter(Boolean) as RouteCoordinates[];

    const validCoordinates = coordinates.filter(isValidCoordinate);

    return validCoordinates.length >= 2 ? validCoordinates : null;
  } catch {
    return null;
  }
}

function parseStepsFromJson(value?: string): NavigationStep[] | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) return null;

    const validSteps = parsed
      .map((item): NavigationStep | null => {
        if (!item || typeof item !== 'object') return null;

        const instruction = String(item.instruction ?? '').trim();
        const streetName = String(item.streetName ?? item.name ?? '').trim();
        const nextInstruction = String(item.nextInstruction ?? '').trim();
        const distance = String(item.distance ?? '').trim();
        const maneuver = String(item.maneuver ?? 'straight') as NavigationManeuver;

        if (!instruction) return null;

        return {
          instruction,
          streetName,
          nextInstruction,
          distance,
          maneuver: ['straight', 'left', 'right', 'arrive'].includes(maneuver)
            ? maneuver
            : 'straight',
        };
      })
      .filter(Boolean) as NavigationStep[];

    return validSteps.length > 0 ? validSteps : null;
  } catch {
    return null;
  }
}

function getManeuverIcon(maneuver: NavigationManeuver): IoniconName {
  switch (maneuver) {
    case 'left':
      return 'return-up-back';
    case 'right':
      return 'return-up-forward';
    case 'arrive':
      return 'flag';
    case 'straight':
    default:
      return 'arrow-up';
  }
}

function EmptyNavigationState({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={styles.emptySafeArea} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBlue}
        translucent={false}
      />

      <View style={styles.emptyScreen}>
        <View style={styles.emptyHeader}>
          <TouchableOpacity
            style={styles.emptyBackButton}
            onPress={onBack}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.emptyHeaderTitle}>Navegação ativa</Text>
        </View>

        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="navigate-outline" size={42} color="#94A3B8" />
          </View>

          <Text style={styles.emptyTitle}>
            Não foi possível iniciar a navegação.
          </Text>

          <Text style={styles.emptyDescription}>
            Volte para a rota e tente novamente.
          </Text>

          <TouchableOpacity
            style={styles.emptyButton}
            onPress={onBack}
            activeOpacity={0.85}
          >
            <Ionicons
              name="arrow-back-outline"
              size={18}
              color={COLORS.white}
              style={styles.emptyButtonIcon}
            />

            <Text style={styles.emptyButtonText}>Voltar para rota</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

type ActiveRouteMapProps = {
  origin: RouteCoordinates;
  destination: RouteCoordinates;
  originName: string;
  destinationName: string;
  routeCoordinates: RouteCoordinates[];
  recenterSignal: number;
};

function ActiveRouteMap({
  origin,
  destination,
  originName,
  destinationName,
  routeCoordinates,
  recenterSignal,
}: ActiveRouteMapProps) {
  const isWeb = Platform.OS === 'web';
  const webMapId = 'active-route-map-leaflet';

  const webMapRef = useRef<any>(null);
  const webMarkersRef = useRef<any[]>([]);
  const webPolylineRef = useRef<any>(null);
  const nativeMapRef = useRef<any>(null);

  const mapInitialRegion = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
    latitudeDelta: Math.abs(origin.latitude - destination.latitude) * 3 + 0.01,
    longitudeDelta:
      Math.abs(origin.longitude - destination.longitude) * 3 + 0.01,
  };

  const fitNativeMapToRoute = useCallback(() => {
    if (!nativeMapRef.current?.fitToCoordinates) return;

    nativeMapRef.current.fitToCoordinates(routeCoordinates, {
      edgePadding: {
        top: 150,
        right: 70,
        bottom: 320,
        left: 70,
      },
      animated: true,
    });
  }, [routeCoordinates]);

  const fitWebMapToRoute = useCallback(() => {
    const L = (window as any).L;
    const map = webMapRef.current;

    if (!L || !map || routeCoordinates.length < 2) return;

    const bounds = L.latLngBounds(
      routeCoordinates.map((coord) => [coord.latitude, coord.longitude]),
    );

    map.fitBounds(bounds, {
      paddingTopLeft: [42, 130],
      paddingBottomRight: [42, 285],
    });
  }, [routeCoordinates]);

  useEffect(() => {
    if (isWeb) return;

    const timeout = setTimeout(fitNativeMapToRoute, 350);

    return () => clearTimeout(timeout);
  }, [isWeb, fitNativeMapToRoute]);

  useEffect(() => {
    if (recenterSignal <= 0) return;

    if (isWeb) {
      fitWebMapToRoute();
      return;
    }

    fitNativeMapToRoute();
  }, [recenterSignal, isWeb, fitNativeMapToRoute, fitWebMapToRoute]);

  useEffect(() => {
    if (!isWeb) return undefined;

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
      }).setView([mapInitialRegion.latitude, mapInitialRegion.longitude], 15);

      (container as any)._leaflet_map = map;
      webMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '\u00a9 OpenStreetMap contributors',
      }).addTo(map);

      webMarkersRef.current.forEach((marker) => marker.remove());
      webMarkersRef.current = [];

      const createDotIcon = (color: string) =>
        L.divIcon({
          className: 'route-dot-icon',
          html: `
            <div style="
              background-color:${color};
              width:18px;
              height:18px;
              border-radius:50%;
              border:3px solid white;
              box-shadow:0 0 8px rgba(0,0,0,0.35);
            "></div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

      const userIcon = L.divIcon({
        className: 'user-current-icon',
        html: `
          <div style="
            width:52px;
            height:52px;
            border-radius:26px;
            background:rgba(20,115,230,0.14);
            display:flex;
            align-items:center;
            justify-content:center;
          ">
            <div style="
              width:42px;
              height:42px;
              border-radius:21px;
              background:white;
              display:flex;
              align-items:center;
              justify-content:center;
              box-shadow:0 5px 12px rgba(0,0,0,0.25);
              color:#1473E6;
              font-size:23px;
              font-weight:900;
            ">
              ➤
            </div>
          </div>
        `,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
      });

      const originMarker = L.marker([origin.latitude, origin.longitude], {
        icon: createDotIcon(COLORS.primaryBlue),
      })
        .addTo(map)
        .bindPopup(`<b>Origem</b><br/>${originName}`);

      const destinationMarker = L.marker(
        [destination.latitude, destination.longitude],
        {
          icon: createDotIcon(COLORS.primaryGreen),
        },
      )
        .addTo(map)
        .bindPopup(`<b>Destino</b><br/>${destinationName}`);

      const userMarker = L.marker(
        [MOCK_USER_POSITION.latitude, MOCK_USER_POSITION.longitude],
        {
          icon: userIcon,
        },
      ).addTo(map);

      webMarkersRef.current.push(originMarker, destinationMarker, userMarker);

      if (webPolylineRef.current) {
        webPolylineRef.current.remove();
        webPolylineRef.current = null;
      }

      webPolylineRef.current = L.polyline(
        routeCoordinates.map((coord) => [coord.latitude, coord.longitude]),
        {
          color: COLORS.route,
          weight: 6,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        },
      ).addTo(map);

      const bounds = L.latLngBounds(
        routeCoordinates.map((coord) => [coord.latitude, coord.longitude]),
      );

      map.fitBounds(bounds, {
        paddingTopLeft: [42, 130],
        paddingBottomRight: [42, 285],
      });

      setTimeout(() => map.invalidateSize(), 120);
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
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
    originName,
    destinationName,
    routeCoordinates,
    mapInitialRegion.latitude,
    mapInitialRegion.longitude,
  ]);

  if (isWeb) {
    return (
      <View style={styles.webMapContainer}>
        <View nativeID={webMapId} style={styles.webMap} />
      </View>
    );
  }

  if (!MapView || !Marker || !Polyline) {
    return (
      <View style={styles.mapFallback}>
        <Ionicons name="map-outline" size={48} color="#94A3B8" />
        <Text style={styles.mapFallbackText}>Carregando mapa...</Text>
      </View>
    );
  }

  return (
    <MapView
      ref={nativeMapRef}
      style={styles.map}
      initialRegion={mapInitialRegion}
      showsUserLocation={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      scrollEnabled
      zoomEnabled
      loadingEnabled
      onMapReady={fitNativeMapToRoute}
    >
      <Polyline
        coordinates={routeCoordinates}
        strokeColor={COLORS.route}
        strokeWidth={6}
        lineCap="round"
        lineJoin="round"
        zIndex={1}
      />

      <Marker
        coordinate={origin}
        title="Origem"
        description={originName}
        image={MARKER_DOT_GREEN}
        anchor={{ x: 0.5, y: 0.5 }}
        centerOffset={{ x: 0, y: 0 }}
        zIndex={5}
      />

      <Marker
        coordinate={destination}
        title="Destino"
        description={destinationName}
        image={MARKER_DOT_GREEN}
        anchor={{ x: 0.5, y: 0.5 }}
        centerOffset={{ x: 0, y: 0 }}
        zIndex={6}
      />

      <Marker
        coordinate={MOCK_USER_POSITION}
        title="Você está aqui"
        image={USER_LOCATION_MARKER}
        anchor={{ x: 0.5, y: 0.5 }}
        centerOffset={{ x: 0, y: 0 }}
        zIndex={10}
      />
    </MapView>
  );
}

type TopInstructionCardProps = {
  step: NavigationStep;
  compact: boolean;
  topOffset: number;
};

function TopInstructionCard({
  step,
  compact,
  topOffset,
}: TopInstructionCardProps) {
  const maneuverIcon = getManeuverIcon(step.maneuver);

  return (
    <View
      style={[
        styles.topInstructionWrapper,
        { top: topOffset },
        compact && styles.topInstructionWrapperCompact,
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.topInstructionCard,
          compact && styles.topInstructionCardCompact,
        ]}
      >
        <View
          style={[
            styles.topInstructionIconBox,
            compact && styles.topInstructionIconBoxCompact,
          ]}
        >
          <Ionicons
            name={maneuverIcon}
            size={compact ? 24 : 28}
            color={COLORS.white}
          />
        </View>

        <View style={styles.topInstructionTextBox}>
          <Text style={styles.topInstructionPrefix} numberOfLines={1}>
            {step.streetName ? `em direção a ${step.streetName}` : 'continue na rota'}
          </Text>

          <Text
            style={[
              styles.topInstructionTitle,
              compact && styles.topInstructionTitleCompact,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {step.instruction}
          </Text>

          <View style={styles.topInstructionFooter}>
            {!!step.distance && (
              <Text style={styles.topInstructionDistance} numberOfLines={1}>
                {step.distance}
              </Text>
            )}

            {!!step.nextInstruction && (
              <View style={styles.nextActionPill}>
                <Text style={styles.nextActionPillText} numberOfLines={1}>
                  Depois
                </Text>

                <Ionicons
                  name="return-up-forward"
                  size={15}
                  color={COLORS.white}
                  style={styles.nextActionPillIcon}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function FloatingMapControls({
  onRecenter,
  onOpenSecurity,
  topOffset,
}: {
  onRecenter: () => void;
  onOpenSecurity: () => void;
  topOffset: number;
}) {
  return (
    <View style={[styles.floatingControls, { top: topOffset + 180 }]}>
      <TouchableOpacity
        style={styles.recenterFab}
        activeOpacity={0.85}
        onPress={onRecenter}
        accessibilityRole="button"
        accessibilityLabel="Recentralizar mapa"
      >
        <Ionicons name="locate" size={25} color={COLORS.primaryGreen} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.securityFab}
        activeOpacity={0.85}
        onPress={onOpenSecurity}
        accessibilityRole="button"
        accessibilityLabel="Recursos de segurança"
      >
        <Ionicons name="shield-checkmark" size={25} color={COLORS.primaryBlue} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sosButton}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Botão SOS visual"
      >
        <Text style={styles.sosButtonText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

function BottomNavigationCard({
  destinationName,
  estimatedTime,
  totalDistance,
  riskLevel,
  bottomOffset,
  onExit,
  onRecenter,
}: {
  destinationName: string;
  estimatedTime: string;
  totalDistance: string;
  riskLevel: string;
  bottomOffset: number;
  onExit: () => void;
  onRecenter: () => void;
}) {
  return (
    <View style={[styles.bottomCard, { bottom: bottomOffset }]}>
      <View style={styles.bottomDestinationRow}>
        <View style={styles.bottomClockIcon}>
          <Ionicons name="time-outline" size={24} color={COLORS.danger} />
        </View>

        <View style={styles.bottomDestinationTextBox}>
          <Text style={styles.bottomDestinationTitle} numberOfLines={1}>
            {destinationName}
          </Text>

          <Text style={styles.bottomArrivalText} numberOfLines={1}>
            Chegada prevista: {estimatedTime} · {totalDistance}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRiskRow}>
        <View style={styles.bottomRiskHeader}>
          <View>
            <Text style={styles.bottomRiskLabel} numberOfLines={1}>
              Risco do trecho
            </Text>

            <Text style={styles.bottomRiskValue} numberOfLines={1}>
              {riskLevel}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomActionsRow}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={onExit}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Sair da navegação"
        >
          <Ionicons name="close" size={20} color="#B42318" />
          <Text style={styles.exitButtonText}>Sair</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerButton}
          activeOpacity={0.85}
          onPress={onRecenter}
          accessibilityRole="button"
          accessibilityLabel="Centralizar mapa"
        >
          <Ionicons name="locate" size={20} color={COLORS.white} />
          <Text style={styles.centerButtonText}>Centralizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ActiveRouteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ActiveRouteParams>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [recenterSignal, setRecenterSignal] = useState(0);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const {
    activeSession,
    isStarting,
    isStopping,
    isCopying,
    errorMessage,
    successMessage,
    startSharing,
    stopSharing,
    copyShareLink,
  } = useShareTrip();

  const originName = String(params.originName ?? '').trim();
  const destinationName = String(params.destinationName ?? '').trim();

  const estimatedTime = String(
    params.estimatedTime ?? MOCK_ACTIVE_ROUTE.estimatedTime,
  ).trim();

  const totalDistance = String(
    params.totalDistance ?? MOCK_ACTIVE_ROUTE.totalDistance,
  ).trim();

  const riskLevel = String(
    params.riskLevel ?? MOCK_ACTIVE_ROUTE.currentRisk,
  ).trim();

  const origin: RouteCoordinates = {
    latitude: parseCoord(params.originLatitude, MOCK_USER_POSITION.latitude),
    longitude: parseCoord(params.originLongitude, MOCK_USER_POSITION.longitude),
  };

  const destination: RouteCoordinates = {
    latitude: parseCoord(params.destinationLatitude, FALLBACK_DESTINATION.latitude),
    longitude: parseCoord(
      params.destinationLongitude,
      FALLBACK_DESTINATION.longitude,
    ),
  };

  const parsedRouteCoordinates = useMemo(
    () => parseRouteCoordinatesFromJson(params.routeCoordinatesJson),
    [params.routeCoordinatesJson],
  );

  const parsedSteps = useMemo(
    () => parseStepsFromJson(params.stepsJson),
    [params.stepsJson],
  );

  const routeCoordinates = useMemo(() => {
    if (parsedRouteCoordinates?.length) {
      return parsedRouteCoordinates;
    }

    return createMockRouteLine(origin, destination);
  }, [origin, destination, parsedRouteCoordinates]);

  const steps = parsedSteps ?? MOCK_ACTIVE_ROUTE.steps;
  const currentStep = steps[MOCK_ACTIVE_ROUTE.currentStepIndex] ?? steps[0];

  const hasRouteData = originName.length > 0 && destinationName.length > 0;
  const isCompactScreen = width < 370 || height < 700;

  const instructionTopOffset = useMemo(() => {
    if (Platform.OS === 'web') return 12;

    const safeTop = insets.top || StatusBar.currentHeight || 0;

    if (isCompactScreen) {
      return Math.max(safeTop + 2, 8);
    }

    return Math.max(safeTop + 4, 10);
  }, [insets.top, isCompactScreen]);

  const bottomCardOffset = useMemo(() => {
    if (Platform.OS === 'web') return 16;

    if (Platform.OS === 'android') {
      return Math.max(insets.bottom, ANDROID_NAV_FALLBACK_BOTTOM);
    }

    return Math.max(insets.bottom, 16);
  }, [insets.bottom]);

  const handleRecenter = useCallback(() => {
    setRecenterSignal((current) => current + 1);
  }, []);

  if (!hasRouteData) {
    return <EmptyNavigationState onBack={() => router.back()} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.screen}>
        <ActiveRouteMap
          origin={origin}
          destination={destination}
          originName={originName}
          destinationName={destinationName}
          routeCoordinates={routeCoordinates}
          recenterSignal={recenterSignal}
        />

        <TopInstructionCard
          step={currentStep}
          compact={isCompactScreen}
          topOffset={instructionTopOffset}
        />

        <FloatingMapControls
          onRecenter={handleRecenter}
          onOpenSecurity={() => setIsSecurityOpen(true)}
          topOffset={instructionTopOffset}
        />

        <BottomNavigationCard
          destinationName={destinationName}
          estimatedTime={estimatedTime}
          totalDistance={totalDistance}
          riskLevel={riskLevel}
          bottomOffset={bottomCardOffset}
          onExit={() => router.back()}
          onRecenter={handleRecenter}
        />

        {isSecurityOpen && (
          <SafetyResourcesSheet
            activeSession={activeSession}
            isStarting={isStarting}
            isStopping={isStopping}
            isCopying={isCopying}
            errorMessage={errorMessage}
            successMessage={successMessage}
            onStartSharing={() => startSharing(origin, destination)}
            onStopSharing={stopSharing}
            onCopyLink={copyShareLink}
            onClose={() => setIsSecurityOpen(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  webMapContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  webMap: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  mapFallback: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapFallbackText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },

  topInstructionWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
  },

  topInstructionWrapperCompact: {
    left: 9,
    right: 9,
  },

  topInstructionCard: {
    width: '100%',
    maxWidth: 520,
    minHeight: 82,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  topInstructionCardCompact: {
    minHeight: 76,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  topInstructionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  topInstructionIconBoxCompact: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },

  topInstructionTextBox: {
    flex: 1,
    minWidth: 0,
  },

  topInstructionPrefix: {
    color: '#D9FFF7',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 1,
  },

  topInstructionTitle: {
    color: COLORS.white,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },

  topInstructionTitleCompact: {
    fontSize: 22,
    lineHeight: 26,
  },

  topInstructionFooter: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  topInstructionDistance: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },

  nextActionPill: {
    minHeight: 23,
    borderRadius: 12,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  nextActionPillText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  nextActionPillIcon: {
    marginLeft: 5,
  },

  floatingControls: {
    position: 'absolute',
    right: 18,
    alignItems: 'center',
    gap: 15,
  },

  recenterFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },

  securityFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },

  sosButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.danger,
    shadowOpacity: 0.42,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },

  sosButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -5 },
    elevation: 10,
  },

  bottomDestinationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  bottomClockIcon: {
    width: 38,
    alignItems: 'center',
    paddingTop: 2,
    marginRight: 10,
  },

  bottomDestinationTextBox: {
    flex: 1,
    minWidth: 0,
  },

  bottomDestinationTitle: {
    color: COLORS.textDark,
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 4,
  },

  bottomArrivalText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },

  bottomRiskRow: {
    marginTop: 15,
    paddingLeft: 48,
  },

  bottomRiskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bottomRiskLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 1,
  },

  bottomRiskValue: {
    color: COLORS.warning,
    fontSize: 15,
    fontWeight: '900',
  },

  riskBadge: {
    minHeight: 30,
    borderRadius: 15,
    backgroundColor: '#E6F7F2',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  riskBadgeText: {
    color: COLORS.primaryGreen,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 5,
  },

  riskBarRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 9,
  },

  riskBar: {
    width: 42,
    height: 5,
    borderRadius: 999,
  },

  riskBarLow: {
    backgroundColor: '#22C55E',
  },

  riskBarMedium: {
    backgroundColor: '#F59E0B',
  },

  riskBarHigh: {
    backgroundColor: '#DC2626',
  },

  bottomActionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
  },

  exitButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 1.4,
    borderColor: '#D0D5DD',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  exitButtonText: {
    color: '#B42318',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },

  centerButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.primaryBlue,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },

  centerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },

  emptySafeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBlue,
  },

  emptyScreen: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  emptyHeader: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyBackButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  emptyHeaderTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginRight: 50,
  },

  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  emptyIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  emptyTitle: {
    color: COLORS.primaryBlue,
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
    backgroundColor: COLORS.primaryGreen,
    minHeight: 50,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryGreen,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  emptyButtonIcon: {
    marginRight: 8,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});