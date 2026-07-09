import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
  TouchableOpacity
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import MapScreen, { MapScreenRef } from '@/components/MapScreen';
import LocationReviewButton from '@/components/LocationReviewButton';
import ReviewModal from '@/components/ReviewModal';
import ConfirmReviewModal from '@/components/ConfirmReviewModal';
import RiskIndicator from '@/components/RiskIndicator';
import EmergencyButton from '@/components/EmergencyButton';
import EmergencyModal from '@/components/EmergencyModal';
import { OccurrenceDetailSheet } from '@/components/OccurrenceDetailSheet';
import { reviewApi, LocationReviewResponse, RiskResponse } from '@/services/api';
import { useLocation } from '@/hooks/useLocation';
import { NotificationFacade } from '@/services/notifications/NotificationFacade';
import AlertScreen from '@/components/alerts/AlertScreen';
import { alertApi, AlertPayload } from '@/services/alertApi';
import * as Notifications from 'expo-notifications';
import { useHandedness } from '@/context/HandednessContext';
import Sidebar from '@/components/Sidebar';
import BaseScreen from '@/components/BaseScreen';

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
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('offline');
  const [areaRisk, setAreaRisk] = useState<RiskResponse>({ level: 'AZUL', score: 0, count: 0 });
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);

  // Ergonomics & Sidebar States
  const { isRightHanded } = useHandedness();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarLegendExpanded, setSidebarLegendExpanded] = useState(false);
  const [tipBannerVisible, setTipBannerVisible] = useState(false);

  const mapRef = useRef<MapScreenRef>(null);

  useEffect(() => {
    console.log('[HomeScreen] Inicializando serviços de rastreamento...');
    void startBackgroundLocation();
  }, []);

  useEffect(() => {
    const checkNotificationPermission = async () => {
      let enabled = false;
      if (Platform.OS === 'web') {
        enabled = 'Notification' in window && window.Notification.permission === 'granted';
      } else {
        try {
          const { status } = await Notifications.getPermissionsAsync();
          enabled = status === 'granted';
        } catch {
          enabled = false;
        }
      }
      if (enabled) {
        void NotificationFacade.registrarTokenNoBackend();
      }
    };
    void checkNotificationPermission();
  }, []);

  useEffect(() => {
    const unsubscribe = NotificationFacade.configurarListenersFirebase((alerta) => {
      console.log('[HomeScreen] Alerta push recebido:', alerta);
      void NotificationFacade.processarAlertaDeRisco(alerta, setAlerts);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadReviews = async () => {
    try {
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
    setEmergencyModalVisible(true);
  };

  const showTipBanner = () => {
    setTipBannerVisible(true);
    setTimeout(() => {
      setTipBannerVisible(false);
    }, 5000);
  };

  return (
    <BaseScreen>
      <SafeAreaView style={styles.container} edges={['top']}>
      {/* Main Map Area */}
      <View style={styles.mapContainer}>
        <MapScreen
          ref={mapRef}
          reviews={reviews}
          selectedPoint={selectedPoint}
          onMapSelectPoint={handleMapSelectPoint}
          onRegionChangeComplete={handleRegionChangeComplete}
          userLocation={userLat !== null && userLng !== null ? { latitude: userLat, longitude: userLng } : null}
          onRecenterPress={getUserLocation}
          isRightHanded={isRightHanded}
          onReviewPress={(id) => {
            const cleanId = id.replace('mock-', '');
            setActiveReviewId(cleanId);
          }}
          riskLevel={areaRisk.level}
        />

        {/* Top Header overlaying the map */}
        <View style={styles.header}>
          {isRightHanded ? (
            <>
              {/* Left Slot: Tip Button */}
              <TouchableOpacity style={styles.headerIconBtn} onPress={showTipBanner} activeOpacity={0.7}>
                <Ionicons name="help-circle" size={22} color="#D4903C" />
              </TouchableOpacity>

              {/* Center Slot: Centered Risk Indicator Pill */}
              <View style={styles.headerCenter}>
                <RiskIndicator
                  level={areaRisk.level}
                  score={areaRisk.score}
                  count={areaRisk.count}
                  onOpenLegend={() => {
                    setSidebarLegendExpanded(true);
                    setSidebarVisible(true);
                  }}
                />
              </View>

              {/* Right Slot: Sidebar Toggle Button */}
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => setSidebarVisible(true)} activeOpacity={0.7}>
                <Ionicons name="menu" size={22} color="#E8EDF2" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Left Slot: Sidebar Toggle Button */}
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => setSidebarVisible(true)} activeOpacity={0.7}>
                <Ionicons name="menu" size={22} color="#E8EDF2" />
              </TouchableOpacity>

              {/* Center Slot: Centered Risk Indicator Pill */}
              <View style={styles.headerCenter}>
                <RiskIndicator
                  level={areaRisk.level}
                  score={areaRisk.score}
                  count={areaRisk.count}
                  onOpenLegend={() => {
                    setSidebarLegendExpanded(true);
                    setSidebarVisible(true);
                  }}
                />
              </View>

              {/* Right Slot: Tip Button */}
              <TouchableOpacity style={styles.headerIconBtn} onPress={showTipBanner} activeOpacity={0.7}>
                <Ionicons name="help-circle" size={22} color="#D4903C" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Temporary Tip Banner */}
        {tipBannerVisible && (
          <View style={styles.tipBanner}>
            <Ionicons name="information-circle-outline" size={18} color="#ffffff" />
            <Text style={styles.tipBannerText}>
              Dica: Dê um toque longo em qualquer ponto do mapa para selecionar a localização do reporte.
            </Text>
            <TouchableOpacity onPress={() => setTipBannerVisible(false)}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Botão de Recentralização */}
        <TouchableOpacity
          style={[
            styles.recenterButtonBottom,
            isRightHanded ? { left: 16 } : { right: 16 },
            { bottom: 160 + insets.bottom }
          ]}
          onPress={() => mapRef.current?.recenter()}
          activeOpacity={0.8}
          accessibilityLabel="Centralizar na minha localização"
        >
          <Ionicons name="locate" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Botão de Emergência */}
        <EmergencyButton
          onPress={handleEmergencyPress}
          style={[
            isRightHanded ? { right: 16 } : { left: 16 },
            { bottom: 150 + insets.bottom }
          ]}
        />

        {/* CONTAINER DO BOTÃO DE REGISTRAR OCORRÊNCIA */}
        <View style={[
          styles.actionButtonsContainer,
          { bottom: 12 + insets.bottom }
        ]}>
          {selectedPoint ? (
            <>
              <View style={styles.smallButtonWrapper}>
                <LocationReviewButton
                  isSelected={selectedPoint !== null}
                  onPress={handleReviewButtonClick}
                />
              </View>

              <TouchableOpacity
                style={styles.clearSelectionButtonSmall}
                onPress={() => setSelectedPoint(null)}
              >
                <Ionicons name="close" size={18} color="#ffffff" />
                <Text style={styles.clearSelectionButtonTextSmall}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.mapHintCard}
              onPress={showTipBanner}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Como registrar uma ocorrencia"
            >
              <View style={styles.mapHintIcon}>
                <Ionicons name="location-outline" size={20} color="#3B9B6E" />
              </View>

              <View style={styles.mapHintTextBox}>
                <Text style={styles.mapHintTitle}>Registrar ocorrencia</Text>
                <Text style={styles.mapHintText} numberOfLines={2}>
                  Toque e segure no mapa para marcar o local.
                </Text>
              </View>
            </TouchableOpacity>
          )}
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

      <EmergencyModal
        visible={emergencyModalVisible}
        onClose={() => setEmergencyModalVisible(false)}
        userLatitude={userLat}
        userLongitude={userLng}
      />

      {activeReviewId !== null && (
        <OccurrenceDetailSheet
          occurrenceId={activeReviewId}
          onClose={() => setActiveReviewId(null)}
        />
      )}

      {/* Sidebar Control Panel */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => {
          setSidebarVisible(false);
          setSidebarLegendExpanded(false);
        }}
        backendStatus={backendStatus}
        onReloadReviews={loadReviews}
        defaultLegendExpanded={sidebarLegendExpanded}
      />
    </SafeAreaView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 60 : 68,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 0,
    zIndex: 100,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26,53,80,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 68,
    left: 16,
    right: 16,
    backgroundColor: '#2A6B5A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 999,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  tipBannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  recenterButtonBottom: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A3550',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  actionButtonsContainer: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 80,
    elevation: 8,
  },
  smallButtonWrapper: {
    transform: [{ scale: 0.94 }],
  },
  clearSelectionButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
    backgroundColor: '#1A3550',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    elevation: 4,
  },
  clearSelectionButtonTextSmall: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  mapHintCard: {
    width: 315,
    minHeight: 76,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1A3550',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  mapHintIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mapHintTextBox: {
    flex: 1,
    minWidth: 0,
  },
  mapHintTitle: {
    color: '#1A3550',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  mapHintText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
