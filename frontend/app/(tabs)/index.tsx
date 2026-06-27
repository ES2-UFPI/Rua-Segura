import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '@/components/MapScreen';
import LocationReviewButton from '@/components/LocationReviewButton';
import ReviewModal from '@/components/ReviewModal';
import ConfirmReviewModal from '@/components/ConfirmReviewModal';
import RiskIndicator from '@/components/RiskIndicator';
import EmergencyButton from '@/components/EmergencyButton';
import { reviewApi, LocationReviewResponse, RiskResponse } from '@/services/api';
import { useLocation } from '@/hooks/useLocation';
import { NotificationFacade } from '@/services/notifications/NotificationFacade';
import AlertScreen from '@/components/alerts/AlertScreen';
import { alertApi, AlertPayload } from '@/services/alertApi';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
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
  const [isRightHanded, setIsRightHanded] = useState(true);
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);

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
      
      const atualizarRiscoPorMovimento = async () => {
        try {
          const riskData = await reviewApi.getAreaRisk(userLat, userLng);
          setAreaRisk(riskData);
          console.log(`[HomeScreen Reativa] Consulta de risco atualizada via GPS: ${riskData.level}`);
        } catch (error) {
          console.error("Erro ao atualizar risco por movimento de GPS:", error);
        }
      };
      
      void atualizarRiscoPorMovimento();
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

  const handleEmergencyPress = () => {
    Alert.alert("Emergência", "Botão de emergência acionado! (Ação apenas estética nesta sprint).");
  };

  const dynamicSideStyle = isRightHanded ? { right: 16 } : { left: 16 };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Map Area */}
      <View style={styles.mapContainer}>
        <MapScreen
          reviews={reviews}
          selectedPoint={selectedPoint}
          onMapSelectPoint={handleMapSelectPoint}
          onRegionChangeComplete={handleRegionChangeComplete}
          userLocation={userLat !== null && userLng !== null ? { latitude: userLat, longitude: userLng } : null}
          onRecenterPress={getUserLocation}
          isRightHanded={isRightHanded}
        />

        {/* Botão flutuante indicativo do status da API no topo do stack lateral */}
        <TouchableOpacity
          style={[
            styles.apiStatusFloating,
            isRightHanded ? { right: 12 } : { left: 12 }
          ]}
          onPress={() => void loadReviews()}
          activeOpacity={0.8}
          accessibilityLabel={`Status da API: ${backendStatus}. Clique para recarregar.`}
        >
          <View
            style={[
              styles.statusDotInner,
              { backgroundColor: backendStatus === 'online' ? '#10b981' : '#ef4444' },
            ]}
          />
        </TouchableOpacity>
        
        <RiskIndicator 
          level={areaRisk.level} 
          score={areaRisk.score} 
          isRightHanded={isRightHanded} 
        />
        
        {/* Balão de Controle do Modo Destro/Canhoto */}
        <TouchableOpacity 
          style={[
            styles.handSelectorBubble, 
            isRightHanded ? { right: 12 } : { left: 12 }
          ]}
          onPress={() => setIsRightHanded(!isRightHanded)}
          activeOpacity={0.8}
        >
          <Ionicons name="hand-left-outline" size={14} color="#2dd4bf" />
          <Text style={styles.handSelectorText}>
            {isRightHanded ? 'Destro' : 'Canhoto'}
          </Text>
        </TouchableOpacity>

        {/* Botão de Emergência mudando de lado */}
        <EmergencyButton
          onPress={handleEmergencyPress}
          style={[
            dynamicSideStyle, 
            { bottom: 90 + insets.bottom, zIndex: 1000 } 
          ]}
        />

        {/* 🌟 CONTAINER DO BOTÃO: Movido para o ponto mais baixo (bottom: 8) e aplicando o scale */}
        <View style={[
          styles.actionButtonsContainer, 
          { bottom: 8 + insets.bottom } 
        ]}>
          <View style={styles.smallButtonWrapper}>
            <LocationReviewButton
              isSelected={selectedPoint !== null}
              onPress={handleReviewButtonClick}
            />
          </View>
          
          {selectedPoint ? (
            <TouchableOpacity
              style={styles.clearSelectionButtonSmall}
              onPress={() => setSelectedPoint(null)}
            >
              <Ionicons name="close-circle" size={18} color="#ffffff" />
              <Text style={styles.clearSelectionButtonTextSmall}>Cancelar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Alertas flutuantes soberanos */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 150 + insets.bottom, 
          pointerEvents: 'box-none', 
          zIndex: 9999,              
          elevation: 10,             
        }}>
          <AlertScreen alerts={alerts} onDismiss={handleDismissAlert} />
        </View>
      </View>

      {/* Barra de Navegação Inferior Estética */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Ionicons name="map" size={22} color="#2dd4bf" />
          <Text style={[styles.tabText, styles.tabTextActive]}>Mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Ionicons name="star" size={22} color="#94a3b8" />
          <Text style={styles.tabText}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Ionicons name="person" size={22} color="#94a3b8" />
          <Text style={styles.tabText}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Modais de Avaliação */}
      {selectedPoint ? (
        <ReviewModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onDone={handleReviewFormDone}
          latitude={selectedPoint.latitude}
          longitude={selectedPoint.longitude}
          initialCategory={pendingReview?.category}
          initialDescription={pendingReview?.description}
        />
      ) : null}

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
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
  apiStatusFloating: {
    position: 'absolute',
    top: 122,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  statusDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  handSelectorBubble: {
    position: 'absolute',
    top: 272, 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 1000,
    elevation: 5,
    gap: 4,
  },
  handSelectorText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  actionButtonsContainer: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 99,
    elevation: 8,
  },
  // 🌟 ESTILO NOVO: Reduz o tamanho do botão em 15% de forma limpa e responsiva
  smallButtonWrapper: {
    transform: [{ scale: 0.85 }], 
  },
  clearSelectionButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 6,
  },
  clearSelectionButtonTextSmall: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomTabBar: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderColor: '#334155',
    zIndex: 100,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  tabText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#2dd4bf', 
  },
});