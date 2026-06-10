import React, { useEffect } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';

// Cores associadas a cada tipo de risco
export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Assalto':
    case 'Briga/agressão':
      return '#dc2626'; // Vermelho vivo
    case 'Assédio':
      return '#db2777'; // Rosa escuro
    case 'Furto':
      return '#f43f5e'; // Rosa
    case 'Perseguição/stalking':
      return '#2563eb'; // Azul
    case 'Movimentação suspeita':
      return '#7c3aed'; // Violeta
    case 'Iluminação ruim':
      return '#d97706'; // Ambar/Laranja
    case 'Local deserto':
      return '#059669'; // Esmeralda
    case 'Infraestrutura inadequada':
    default:
      return '#4b5563'; // Cinza escuro
  }
};

// Carrega react-native-maps de forma segura apenas no Mobile para evitar crash no Web
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
}

export default function MapScreen({
  reviews,
  selectedPoint,
  onMapSelectPoint,
  onRegionChangeComplete,
}: MapScreenProps) {
  const isWeb = Platform.OS === 'web';
  const webMapId = 'leaflet-map-container';

  // --- IMPLEMENTAÇÃO WEB (LEAFLET) ---
  useEffect(() => {
    if (!isWeb) return;

    // Injeta CSS do Leaflet
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const setupWebMap = () => {
      const L = (window as any).L;
      if (!L) return;

      const container = document.getElementById(webMapId);
      if (!container) return;

      // Destrói mapa existente para re-inicializar com os marcadores atualizados
      if ((container as any)._leaflet_map) {
        (container as any)._leaflet_map.remove();
      }

      // Teresina, PI como centro padrão
      const mapCenter: [number, number] = selectedPoint
        ? [selectedPoint.latitude, selectedPoint.longitude]
        : [-5.0920, -42.8038];

      const map = L.map(webMapId).setView(mapCenter, 14);
      (container as any)._leaflet_map = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Clique no mapa para capturar ponto
      map.on('click', (e: any) => {
        onMapSelectPoint(e.latlng.lat, e.latlng.lng);
      });

      // Detecta quando o usuário termina de arrastar o mapa na Web
      map.on('moveend', () => {
        const center = map.getCenter();
        onRegionChangeComplete(center.lat, center.lng);
      });

      // Renderiza marcadores das avaliações existentes
      reviews.forEach((review) => {
        const pinColor = getCategoryColor(review.category);
        
        // Marcador colorido customizado com SVG
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${pinColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        L.marker([review.latitude, review.longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
              <h4 style="margin: 0 0 4px 0; color: ${pinColor}; font-weight: 800;">${review.category}</h4>
              <p style="margin: 0; font-size: 13px;">${review.description}</p>
            </div>
          `);
      });

      // Renderiza marcador de "Ponto Selecionado" para nova avaliação
      if (selectedPoint) {
        const selectedIcon = L.divIcon({
          className: 'selected-div-icon',
          html: `<div style="background-color: #ea580c; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.6); animation: pulse 1.5s infinite;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        // Adiciona regra de animação no document
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

        L.marker([selectedPoint.latitude, selectedPoint.longitude], { icon: selectedIcon })
          .addTo(map)
          .bindPopup('<b>Ponto Selecionado</b><br/>Clique no botão abaixo para avaliar.')
          .openPopup();
      }
    };

    // Carrega script do Leaflet se necessário
    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = setupWebMap;
      document.head.appendChild(script);
    } else {
      setupWebMap();
    }
  }, [reviews, selectedPoint, isWeb]);

  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <div id={webMapId} style={{ width: '100%', height: '100%', outline: 'none' }} />
        <View style={styles.webTip}>
          <Text style={styles.webTipText}>
            Dica: Clique em qualquer ponto do mapa para selecionar o local da ocorrência.
          </Text>
        </View>
      </View>
    );
  }

  // --- IMPLEMENTAÇÃO NATIVE (REACT-NATIVE-MAPS) ---
  const defaultRegion = {
    latitude: selectedPoint ? selectedPoint.latitude : -5.0920,
    longitude: selectedPoint ? selectedPoint.longitude : -42.8038,
    latitudeDelta: 0.015,
    longitudeDelta: 0.012,
  };

  if (!MapView) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Carregando Mapa...</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={defaultRegion}
      onLongPress={(e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        onMapSelectPoint(latitude, longitude);
      }}>
        onRegionChangeComplete={(region: any) => {
        onRegionChangeComplete(region.latitude, region.longitude);
      }}
    >
      {/* Marcadores de avaliações existentes */}
      {reviews.map((review) => (
        <Marker
          key={review.id}
          coordinate={{ latitude: review.latitude, longitude: review.longitude }}
          title={review.category}
          description={review.description}
          pinColor={getCategoryColor(review.category)}
        />
      ))}

      {/* Marcador selecionado temporário */}
      {selectedPoint ? (
        <Marker
          coordinate={selectedPoint}
          title="Local Selecionado"
          description="Clique no botão para registrar a avaliação"
          pinColor="#ea580c"
        />
      ) : null}
    </MapView>
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
  webTip: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 1000,
  },
  webTipText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
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
