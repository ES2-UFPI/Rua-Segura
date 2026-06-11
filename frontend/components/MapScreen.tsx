import React, { useEffect, useState, useRef } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
}

export default function MapScreen({
  reviews,
  selectedPoint,
  onMapSelectPoint,
  onRegionChangeComplete,
  userLocation,
  onRecenterPress,
}: MapScreenProps) {
  const isWeb = Platform.OS === 'web';
  const webMapId = 'leaflet-map-container';

  // Estados de controle para a Dica e para o Alerta de Área
  const [isTipExpanded, setIsTipExpanded] = useState(true); // Começa mostrando na tela
  const [isAlertExpanded, setIsAlertExpanded] = useState(true); // Começa mostrando na tela
  const mapCenterRef = useRef<[number, number] | null>(null);

  // Refs para controle do mapa Leaflet e Native
  const webMapRef = useRef<any>(null);
  const webMarkersRef = useRef<any[]>([]);
  const webSelectedMarkerRef = useRef<any>(null);
  const nativeMapRef = useRef<any>(null);
  const hasCenteredOnUserRef = useRef<boolean>(false);
  const forceCenterRef = useRef<boolean>(false);

  const [mapReady, setMapReady] = useState(false);

  // Mantém os callbacks atualizados em refs para evitar re-registro ou stale closures
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

    // Reseta o flag forceCenterRef após 3 segundos caso a coordenada do usuário não mude
    setTimeout(() => {
      forceCenterRef.current = false;
    }, 3000);

    if (userLocation) {
      if (isWeb && webMapRef.current) {
        webMapRef.current.setView([userLocation.latitude, userLocation.longitude], 16);
        mapCenterRef.current = [userLocation.latitude, userLocation.longitude];
        onRegionChangeCompleteRef.current(userLocation.latitude, userLocation.longitude);
      } else if (!isWeb && nativeMapRef.current) {
        nativeMapRef.current.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.004,
        }, 1000);
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

  // Minimiza a dica e o alerta automaticamente após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTipExpanded(false);
      setIsAlertExpanded(false); // Recolhe após o tempo determinado
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // --- IMPLEMENTAÇÃO WEB (LEAFLET) ---
  // 1. Inicializa o mapa Leaflet uma única vez
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

      // Se temos userLocation inicial, centraliza nele, senão no selectedPoint ou default
      const initialCenter: [number, number] = mapCenterRef.current
        ?? (userLocation
          ? [userLocation.latitude, userLocation.longitude]
          : (selectedPoint
            ? [selectedPoint.latitude, selectedPoint.longitude]
            : [-5.0920, -42.8038]));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWeb]);

  // 2. Centraliza o mapa na localização do usuário ao abrir a aplicação (uma única vez ou por solicitação forçada)
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
      nativeMapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.004,
      }, 1000);
      onRegionChangeCompleteRef.current(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation, isWeb, mapReady]);

  // 3. Atualiza os markers no mapa Web (Leaflet) sem destruir/recriar o mapa
  useEffect(() => {
    if (!isWeb || !webMapRef.current || !mapReady) return;

    const L = (window as any).L;
    if (!L) return;

    const map = webMapRef.current;

    // Remove markers antigos
    webMarkersRef.current.forEach((marker) => marker.remove());
    webMarkersRef.current = [];

    // Adiciona novos markers de reviews
    reviews.forEach((review) => {
      const pinColor = getCategoryColor(review.category);

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${pinColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([review.latitude, review.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
            <h4 style="margin: 0 0 4px 0; color: ${pinColor}; font-weight: 800;">${review.category}</h4>
            <p style="margin: 0; font-size: 13px;">${review.description}</p>
          </div>
        `);

      webMarkersRef.current.push(marker);
    });

    // Remove marker selecionado antigo
    if (webSelectedMarkerRef.current) {
      webSelectedMarkerRef.current.remove();
      webSelectedMarkerRef.current = null;
    }

    // Adiciona novo marker selecionado se houver
    if (selectedPoint) {
      const selectedIcon = L.divIcon({
        className: 'selected-div-icon',
        html: `<div style="background-color: #ea580c; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.6); animation: pulse 1.5s infinite;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      if (!document.getElementById('leaflet-animation-style')) {
        const style = document.createElement('style');
        style.id = 'leaflet-animation-style';
        style.innerHTML = `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }

      const marker = L.marker([selectedPoint.latitude, selectedPoint.longitude], { icon: selectedIcon })
        .addTo(map)
        .bindPopup(
          '<b>Ponto Selecionado</b><b><br/>Latitude: </b>' + selectedPoint.latitude.toFixed(5) + '<b> | Longitude: </b>' + selectedPoint.longitude.toFixed(5) + '<br/>Clique no botão abaixo para avaliar.'
        )
        .openPopup();

      webSelectedMarkerRef.current = marker;
    }
  }, [reviews, selectedPoint, isWeb, mapReady]);

  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <div id={webMapId} style={{ width: '100%', height: '100%', outline: 'none' }} />

        {/* ================= DICA DO MAPA ================= */}
        {isTipExpanded ? (
          <View style={styles.webTipExpanded}>
            <Text style={styles.webTipText}>
              {Platform.OS === 'web'
                ? 'Dica: Clique em qualquer ponto do mapa para selecionar o local da ocorrência.'
                : 'Dica: Toque longo em qualquer ponto do mapa para selecionar o local da ocorrência.'}
            </Text>
            <TouchableOpacity
              style={styles.closeTipButton}
              onPress={() => setIsTipExpanded(false)}
            >
              <Text style={styles.closeTipText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.webTipMinimized, { top: 12, right: 12 }]} // Posicionado no canto direito superior
            onPress={() => setIsTipExpanded(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.helpIconText}>?</Text>
          </TouchableOpacity>
        )}

        {/* Floating Recenter Button for Web */}
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={handleRecenter}
          activeOpacity={0.8}
          accessibilityLabel="Centralizar na minha localização"
        >
          <Ionicons name="locate" size={22} color="#2dd4bf" />
        </TouchableOpacity>
      </View>
    );
  }

  // --- IMPLEMENTAÇÃO NATIVE (REACT-NATIVE-MAPS) ---
  const defaultRegion = {
    latitude: selectedPoint
      ? selectedPoint.latitude
      : (userLocation ? userLocation.latitude : -5.0920),
    longitude: selectedPoint
      ? selectedPoint.longitude
      : (userLocation ? userLocation.longitude : -42.8038),
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
      </MapView>

      {/* ================= DICA DO MAPA NATIVE ================= */}
      {isTipExpanded ? (
        <View style={styles.webTipExpanded}>
          <Text style={styles.webTipText}>
            Dica: Toque longo em qualquer ponto do mapa para selecionar o local da ocorrência.
          </Text>
          <TouchableOpacity
            style={styles.closeTipButton}
            onPress={() => setIsTipExpanded(false)}
          >
            <Text style={styles.closeTipText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.webTipMinimized, { top: 12, right: 12 }]}
          onPress={() => setIsTipExpanded(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.helpIconText}>?</Text>
        </TouchableOpacity>
      )}

      {/* Floating Recenter Button for Native */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenter}
        activeOpacity={0.8}
        accessibilityLabel="Centralizar na minha localização"
      >
        <Ionicons name="locate" size={22} color="#2dd4bf" />
      </TouchableOpacity>
    </View>
  );
}

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
  recenterButton: {
    position: 'absolute',
    top: 104,
    right: 12,
    backgroundColor: '#1e293b',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  // Alerta de área em destaque vermelho/escuro expandido no topo
  webAlertExpanded: {
    position: 'absolute',
    top: 300, // Fica logo abaixo da dica se ambas estiverem abertas simultaneamente
    alignSelf: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.95)', // Fundo avermelhado de atenção
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    maxWidth: '90%',
  },
  webAlertText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  webTipExpanded: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    maxWidth: '90%',
  },
  webTipText: {
    color: '#e1d2cbff',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  closeTipButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTipText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Botões redondos flutuantes quando minimizados
  webTipMinimized: {
    position: 'absolute',
    backgroundColor: '#1e293b',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  helpIconText: {
    color: '#fb7e44ff',
    fontSize: 18,
    fontWeight: '800',
  },
  alertIconText: {
    fontSize: 16,
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
});