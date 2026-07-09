import React, { useEffect, useState, useRef, useImperativeHandle } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Assalto':
      return '#000000';
    case 'Briga/agressão':
      return '#dc2626';
    case 'Assédio':
      return '#654321';
    case 'Furto':
      return '#ffb5c0';
    case 'Perseguição/stalking':
      return '#2563eb';
    case 'Movimentação suspeita':
      return '#7c3aed';
    case 'Iluminação ruim':
      return '#d97706';
    case 'Local deserto':
      return '#059669';
    case 'Infraestrutura inadequada':
    default:
      return '#4b5563';
  }
};
const getRiskColors = (level: string) => {
  const normalized = level.toLowerCase();
  if (normalized.includes('baixo') || normalized.includes('azul') || normalized.includes('low')) {
    return {
      hex: '#036D9A',
      rgba: 'rgba(3, 109, 154, 0.16)',
    };
  } else if (normalized.includes('moderado') || normalized.includes('medio') || normalized.includes('médio') || normalized.includes('amarelo') || normalized.includes('medium')) {
    return {
      hex: '#EAB308',
      rgba: 'rgba(234, 179, 8, 0.16)',
    };
  } else if (normalized.includes('alto') || normalized.includes('vermelho') || normalized.includes('high')) {
    return {
      hex: '#CF0000',
      rgba: 'rgba(207, 0, 0, 0.16)',
    };
  }
  return {
    hex: '#036D9A',
    rgba: 'rgba(3, 109, 154, 0.16)',
  };
};

let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
  } catch (e) {
    console.warn('Falha ao carregar react-native-maps:', e);
  }
}

interface MapScreenProps {
  reviews: Array<{
    id: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
  }>;
  selectedPoint: { latitude: number; longitude: number } | null;
  onMapSelectPoint: (latitude: number, longitude: number) => void;
  onRegionChangeComplete: (latitude: number, longitude: number) => void;
  userLocation: { latitude: number; longitude: number } | null;
  onRecenterPress?: () => Promise<void> | void;
  isRightHanded?: boolean;
  onReviewPress?: (id: string) => void;
  riskLevel?: string;
}

export interface MapScreenRef {
  recenter: () => void;
}

const MapScreen = React.forwardRef<MapScreenRef, MapScreenProps>(function MapScreen(
  {
    reviews,
    selectedPoint,
    onMapSelectPoint,
    onRegionChangeComplete,
    userLocation,
    onRecenterPress,
    isRightHanded = true,
    onReviewPress,
    riskLevel = 'AZUL',
  },
  ref
) {
  const isWeb = Platform.OS === 'web';
  const riskColors = getRiskColors(riskLevel);
  const webMapId = 'leaflet-map-container';

  const mapCenterRef = useRef<[number, number] | null>(null);

  const webMapRef = useRef<any>(null);
  const webMarkersRef = useRef<any[]>([]);
  const webSelectedMarkerRef = useRef<any>(null);
  const webUserMarkerRef = useRef<any>(null);
  const nativeMapRef = useRef<any>(null);
  const hasCenteredOnUserRef = useRef<boolean>(false);
  const forceCenterRef = useRef<boolean>(false);

  const [mapReady, setMapReady] = useState(false);

  const onMapSelectPointRef = useRef(onMapSelectPoint);
  const onRegionChangeCompleteRef = useRef(onRegionChangeComplete);

  useEffect(() => {
    onMapSelectPointRef.current = onMapSelectPoint;
  }, [onMapSelectPoint]);

  useEffect(() => {
    onRegionChangeCompleteRef.current = onRegionChangeComplete;
  }, [onRegionChangeComplete]);

  const handleRecenter = async () => {
    forceCenterRef.current = true;
    setTimeout(() => {
      forceCenterRef.current = false;
    }, 3000);

    if (userLocation) {
      if (isWeb && webMapRef.current) {
        webMapRef.current.setView([userLocation.latitude, userLocation.longitude], 16);
        mapCenterRef.current = [userLocation.latitude, userLocation.longitude];
        onRegionChangeCompleteRef.current(userLocation.latitude, userLocation.longitude);
      } else if (!isWeb && nativeMapRef.current) {
        nativeMapRef.current.animateToRegion(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.004,
          },
          1000
        );
        onRegionChangeCompleteRef.current(userLocation.latitude, userLocation.longitude);
      }
    }

    if (onRecenterPress) {
      try {
        await onRecenterPress();
      } catch (err) {
        console.error('Erro ao recentralizar localização:', err);
      }
    }
  };

  // Expose the handleRecenter method to the parent ref
  useImperativeHandle(ref, () => ({
    recenter: handleRecenter,
  }));

  useEffect(() => {
    if (!isWeb) return;

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

      const initialCenter: [number, number] = mapCenterRef.current ??
        (userLocation
          ? [userLocation.latitude, userLocation.longitude]
          : selectedPoint
          ? [selectedPoint.latitude, selectedPoint.longitude]
          : [-5.0920, -42.8038]);
      mapCenterRef.current = initialCenter;

      if (userLocation) {
        hasCenteredOnUserRef.current = true;
      }

      const map = L.map(webMapId).setView(initialCenter, 16);
      (container as any)._leaflet_map = map;
      webMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      map.on('click', (e: any) => {
        onMapSelectPointRef.current(e.latlng.lat, e.latlng.lng);
      });

      map.on('moveend', () => {
        const center = map.getCenter();
        mapCenterRef.current = [center.lat, center.lng];
        onRegionChangeCompleteRef.current(center.lat, center.lng);
      });

      setMapReady(true);
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
  }, [isWeb]);

  useEffect(() => {
    if (!userLocation) return;
    if (hasCenteredOnUserRef.current && !forceCenterRef.current) return;

    if (isWeb && webMapRef.current) {
      hasCenteredOnUserRef.current = true;
      forceCenterRef.current = false;
      webMapRef.current.setView([userLocation.latitude, userLocation.longitude], 16);
      mapCenterRef.current = [userLocation.latitude, userLocation.longitude];
      onRegionChangeCompleteRef.current(userLocation.latitude, userLocation.longitude);
    } else if (!isWeb && nativeMapRef.current) {
      hasCenteredOnUserRef.current = true;
      forceCenterRef.current = false;
      nativeMapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.004,
        },
        1000
      );
      onRegionChangeCompleteRef.current(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation, isWeb, mapReady]);

  useEffect(() => {
    if (!isWeb || !webMapRef.current || !mapReady) return;

    const L = (window as any).L;
    if (!L) return;

    const map = webMapRef.current;
    webMarkersRef.current.forEach((marker) => marker.remove());
    webMarkersRef.current = [];

    reviews.forEach((review) => {
      const pinColor = getCategoryColor(review.category);
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${pinColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([review.latitude, review.longitude], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        if (onReviewPress) {
          onReviewPress(review.id);
        }
      });

      marker.bindPopup(`
          <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
            <h4 style="margin: 0 0 4px 0; color: ${pinColor}; font-weight: 800;">${review.category}</h4>
            <p style="margin: 0; font-size: 13px;">${review.description}</p>
          </div>
        `);
      webMarkersRef.current.push(marker);
    });

    if (webSelectedMarkerRef.current) {
      webSelectedMarkerRef.current.remove();
      webSelectedMarkerRef.current = null;
    }

    if (selectedPoint) {
      const selectedIcon = L.divIcon({
        className: 'selected-div-icon',
        html: `<div style="background-color: #ea580c; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.6); animation: pulse 1.5s infinite;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([selectedPoint.latitude, selectedPoint.longitude], { icon: selectedIcon })
        .addTo(map)
        .bindPopup(
          '<b>Ponto Selecionado</b><b><br/>Latitude: </b>' +
            selectedPoint.latitude.toFixed(5) +
            '<b> | Longitude: </b>' +
            selectedPoint.longitude.toFixed(5) +
            '<br/>Clique no botão abaixo para avaliar.'
        )
        .openPopup();
      webSelectedMarkerRef.current = marker;
    }

    if (webUserMarkerRef.current) {
      webUserMarkerRef.current.remove();
      webUserMarkerRef.current = null;
    }

    if (userLocation) {
      const riskColors = getRiskColors(riskLevel);
      const userIcon = L.divIcon({
        className: 'user-current-icon',
        html: `
          <div style="
            width:32px;
            height:32px;
            border-radius:50%;
            background:${riskColors.rgba};
            display:flex;
            align-items:center;
            justify-content:center;
          ">
            <div style="
              width:16px;
              height:16px;
              border-radius:50%;
              background:${riskColors.hex};
              border:2px solid white;
              box-shadow:0 0 6px rgba(0,0,0,0.3);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Você</b>');
      webUserMarkerRef.current = userMarker;
    }
  }, [reviews, selectedPoint, userLocation, riskLevel, isWeb, mapReady]);

  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <div id={webMapId} style={{ width: '100%', height: '100%', outline: 'none' }} />
      </View>
    );
  }

  const defaultRegion = {
    latitude: selectedPoint ? selectedPoint.latitude : userLocation ? userLocation.latitude : -5.0920,
    longitude: selectedPoint ? selectedPoint.longitude : userLocation ? userLocation.longitude : -42.8038,
    latitudeDelta: 0.005,
    longitudeDelta: 0.004,
  };

  if (!MapView) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Carregando Mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.nativeContainer}>
      <MapView
        ref={nativeMapRef}
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        followsUserLocation={false}
        toolbarEnabled={false}
        onLongPress={(e: any) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onMapSelectPoint(latitude, longitude);
        }}
        onRegionChangeComplete={(region: any) => {
          onRegionChangeComplete(region.latitude, region.longitude);
        }}
      >
        {reviews.map((review) => (
          <Marker
            key={review.id}
            coordinate={{ latitude: review.latitude, longitude: review.longitude }}
            title={review.category}
            description={review.description}
            pinColor={getCategoryColor(review.category)}
            onPress={() => {
              if (onReviewPress) {
                onReviewPress(review.id);
              }
            }}
          />
        ))}

        {selectedPoint ? (
          <Marker
            coordinate={selectedPoint}
            title="Local Selecionado"
            description="Clique no botão para registrar a avaliação"
            pinColor="#ea580c"
          />
        ) : null}

        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Sua Localização"
            anchor={{ x: 0.5, y: 0.5 }}
            centerOffset={{ x: 0, y: 0 }}
            zIndex={10}
          >
            <View
              style={[
                styles.nativeUserMarkerOuter,
                { backgroundColor: riskColors.rgba },
              ]}
            >
              <View
                style={[
                  styles.nativeUserMarkerInnerDot,
                  { backgroundColor: riskColors.hex },
                ]}
              />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
});

export default MapScreen;

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  nativeContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  fallbackText: {
    color: '#cbd5e1',
    fontSize: 16,
  },
  nativeUserMarkerOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeUserMarkerInnerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },
});