import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '@/components/MapScreen';
import LocationReviewButton from '@/components/LocationReviewButton';
import ReviewModal from '@/components/ReviewModal';
import ConfirmReviewModal from '@/components/ConfirmReviewModal';
import RiskIndicator from '@/components/RiskIndicator';
import { reviewApi, LocationReviewResponse, RiskResponse } from '@/services/api';
import { useLocation } from '@/hooks/useLocation';
import { NotificationFacade } from '@/services/notifications/NotificationFacade';
import AlertScreen from '@/components/alerts/AlertScreen';
import { alertApi, AlertPayload } from '@/services/alertApi';

export default function HomeScreen() {
  const { 
    latitude: userLat, 
    longitude: userLng, 
    getUserLocation, 
    startBackgroundLocation 
  } = useLocation();
  
  const [reviews, setReviews] = useState<LocationReviewResponse[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingReview, setPendingReview] = useState<{ category: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('offline');
  const [areaRisk, setAreaRisk] = useState<RiskResponse>({ level: 'AZUL', score: 0, count: 0 });
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);

  useEffect(() => {
    console.log('[HomeScreen] Inicializando serviços de rastreamento...');
    void startBackgroundLocation(); 
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewApi.getReviews();
      setReviews(data);
      setBackendStatus('online');
    } catch (error) {
      setBackendStatus('offline');
      console.error('Falha ao obter avaliações:', error);
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

  const [lastAlertId, setLastAlertId] = useState<string | null>(null);

  const loadCriticalAlerts = async (lat: number, lng: number) => {
    try {
      const activeAlerts = await alertApi.getAlerts({ latitude: lat, longitude: lng });
      
      if (activeAlerts && activeAlerts.length > 0) {
        const novoAlerta = activeAlerts[0];

        if (novoAlerta.id === lastAlertId || alerts.some(a => a.id === novoAlerta.id)) {
          console.log('[HomeScreen] Alerta repetido ignorado para evitar loop.');
          return;
        }

        setLastAlertId(novoAlerta.id);
        await NotificationFacade.processarAlertaDeRisco(novoAlerta, setAlerts);
      }
    } catch (error) {
      console.log('[Alerts] Servidor offline ou rota não implementada no back ainda.');
    }
  };

  useEffect(() => {
    if (userLat !== null && userLng !== null) {
      void loadCriticalAlerts(userLat, userLng);
    }
  }, [userLat, userLng]); 

  const handleDismissAlert = (alertId: string) => {
    console.log(`[HomeScreen] Alerta ${alertId} fechado pelo usuário.`);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));

  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const handleMapSelectPoint = (latitude: number, longitude: number) => {
    setSelectedPoint({ latitude, longitude });
  };

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

  const handleReviewFormDone = (category: string, description: string) => {
    setModalVisible(false);
    setPendingReview({ category, description });
    setConfirmModalVisible(true);
  };

  const handleConfirm = async () => {
    if (!selectedPoint || !pendingReview) return;
    setConfirmModalVisible(false);

    try {
      await handleReviewSubmit(pendingReview.category, pendingReview.description);
      setPendingReview(null);
    } catch (error) {
      console.error('Erro ao confirmar avaliação:', error);
      setPendingReview(null);
    }
  };

  const handleEditReview = () => {
    setConfirmModalVisible(false);
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

      setReviews((prev) => [newReview, ...prev]);
      setSelectedPoint(null);
      
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
          userLocation={userLat !== null && userLng !== null ? { latitude: userLat, longitude: userLng } : null}
          onRecenterPress={getUserLocation}
        />
        <RiskIndicator level={areaRisk.level} score={areaRisk.score} />
        
        {/* Componente de alertas flutuantes no mapa */}
        <AlertScreen alerts={alerts} onDismiss={handleDismissAlert} />
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <LocationReviewButton
          isSelected={selectedPoint !== null}
          onPress={handleReviewButtonClick}
        />
        {selectedPoint ? (
          <TouchableOpacity
            style={styles.clearSelectionButton}
            onPress={() => setSelectedPoint(null)}
            accessibilityLabel="Remover selection"
          >
            <Ionicons name="close-circle" size={24} color="#ffffff" />
            <Text style={styles.clearSelectionButtonText}>Cancelar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Form BottomSheet Modal */}
      <ReviewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onDone={handleReviewFormDone}
        latitude={selectedPoint?.latitude ?? 0}
        longitude={selectedPoint?.longitude ?? 0}
        initialCategory={pendingReview?.category}
        initialDescription={pendingReview?.description}
      />

      <ConfirmReviewModal
        visible={confirmModalVisible}
        category={pendingReview?.category ?? ''}
        description={pendingReview?.description ?? ''}
        latitude={selectedPoint?.latitude ?? 0}
        longitude={selectedPoint?.longitude ?? 0}
        onConfirm={handleConfirm}
        onEdit={handleEditReview}
        onClose={() => {
          setConfirmModalVisible(false);
          setPendingReview(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
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
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  mapContainer: { flex: 1, position: 'relative' },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 10,
    zIndex: 99,
    elevation: 8,
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  clearSelectionButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});