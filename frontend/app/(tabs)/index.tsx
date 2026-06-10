import React, { useEffect, useState, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '@/components/MapScreen';
import LocationReviewButton from '@/components/LocationReviewButton';
import ReviewModal from '@/components/ReviewModal';
import RiskIndicator from '@/components/RiskIndicator';
import { reviewApi, LocationReviewResponse, RiskResponse } from '@/services/api';

export default function HomeScreen() {
  const [reviews, setReviews] = useState<LocationReviewResponse[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('offline');

  // Estado para armazenar o risco da região visível
  const [areaRisk, setAreaRisk] = useState<RiskResponse>({ level: 'AZUL', score: 0, count: 0 });

  // Carrega as avaliações do backend
  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewApi.getReviews();
      setReviews(data);
      setBackendStatus('online');
    } catch (error) {
      setBackendStatus('offline');
      console.error('Falha ao obter avaliações:', error);
      // Fallback local caso o backend esteja inacessível no primeiro load
      if (reviews.length === 0) {
        setReviews([
          {
            id: 'mock-1',
            category: 'Iluminação ruim',
            description: 'Poste quebrado na calçada.',
            latitude: -5.0895,
            longitude: -42.8020,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const handleMapSelectPoint = (latitude: number, longitude: number) => {
    setSelectedPoint({ latitude, longitude });
  };

  // Gatilho que executa a regra de cálculo no Backend
  const handleRegionChangeComplete = useCallback(async (latitude: number, longitude: number) => {
    try {
      const riskData = await reviewApi.getAreaRisk(latitude, longitude);
      setAreaRisk(riskData);
    } catch (error) {
      console.error("Erro na orquestração do risco:", error);
    }
  }, []);

  const handleReviewButtonClick = () => {
    if (!selectedPoint) {
      if (Platform.OS === 'web') {
        alert('Dica: Clique em qualquer ponto do mapa antes de registrar a avaliação!');
      } else {
        Alert.alert(
          'Escolha um local',
          'Clique longo em qualquer ponto do mapa para selecionar a localização da avaliação.'
        );
      }
      return;
    }
    setModalVisible(true);
  };

  const handleReviewSubmit = async (category: string, description: string) => {
    if (!selectedPoint) return;

    try {
      const newReview = await reviewApi.createReview({
        category,
        description,
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
      });

      // Atualiza o estado local com a nova ocorrência vinda do backend
      setReviews((prev) => [newReview, ...prev]);
      setSelectedPoint(null); // Limpa o marcador selecionado
      
      if (Platform.OS === 'web') {
        alert('Avaliação cadastrada com sucesso!');
      } else {
        Alert.alert('Sucesso', 'Sua avaliação de segurança foi registrada com sucesso.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar avaliação:', error);
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Ionicons name="shield-half" size={24} color="#0f766e" />
          <Text style={styles.headerTitle}>Rua Segura</Text>
        </View>
        <TouchableOpacity style={styles.statusBadge} onPress={() => void loadReviews()}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: backendStatus === 'online' ? '#10b981' : '#ef4444' },
            ]}
          />
          <Text style={styles.statusText}>
            API: {backendStatus === 'online' ? 'Online' : 'Offline'}
          </Text>
          <Ionicons name="refresh-outline" size={14} color="#94a3b8" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Main Map Area */}
      <View style={styles.mapContainer}>
        <MapScreen
          reviews={reviews}
          selectedPoint={selectedPoint}
          onMapSelectPoint={handleMapSelectPoint}
          onRegionChangeComplete={handleRegionChangeComplete}
        />
        <RiskIndicator level={areaRisk.level} score={areaRisk.score} />
      </View>

      {/* Info indicator if point selected */}
      {selectedPoint ? (
        <View style={styles.selectedPointCard}>
          <Text style={styles.selectedPointText}>
            Ponto selecionado na latitude: <Text style={styles.coordHighlight}>{selectedPoint.latitude.toFixed(5)}</Text>
          </Text>
          <TouchableOpacity onPress={() => setSelectedPoint(null)} style={styles.clearPointButton}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Floating Action Button */}
      <LocationReviewButton
        isSelected={selectedPoint !== null}
        onPress={handleReviewButtonClick}
      />

      {/* Form BottomSheet Modal */}
      {selectedPoint ? (
        <ReviewModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleReviewSubmit}
          latitude={selectedPoint.latitude}
          longitude={selectedPoint.longitude}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark slate background
  },
  header: {
    height: Platform.OS === 'ios' ? 50 : 60,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#334155',
    zIndex: 100,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  selectedPointCard: {
    position: 'absolute',
    top: 76,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderWidth: 1,
    borderColor: '#ea580c',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 90,
  },
  selectedPointText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  coordHighlight: {
    color: '#ea580c',
    fontWeight: '700',
  },
  clearPointButton: {
    padding: 2,
  },
});
