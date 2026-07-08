import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHandedness } from '@/context/HandednessContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { NotificationFacade } from '@/services/notifications/NotificationFacade';
import { RiskVisualStrategy, RiskLevel } from '../config/RiskVisualStrategy';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  backendStatus: 'online' | 'offline';
  onReloadReviews: () => void;
  defaultLegendExpanded?: boolean;
}

const SIDEBAR_WIDTH = 260;

export default function Sidebar({
  visible,
  onClose,
  backendStatus,
  onReloadReviews,
  defaultLegendExpanded = false,
}: SidebarProps) {
  const { isRightHanded, setIsRightHanded } = useHandedness();
  const insets = useSafeAreaInsets();

  const startOffset = isRightHanded ? SIDEBAR_WIDTH : -SIDEBAR_WIDTH;
  const slideAnim = useRef(new Animated.Value(startOffset)).current;

  // Collapsible States
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(false);

  // Permission Statuses
  const [foregroundLoc, setForegroundLoc] = useState<string>('checking');
  const [backgroundLoc, setBackgroundLoc] = useState<string>('checking');
  const [notifications, setNotifications] = useState<string>('checking');

  const checkPermissions = async () => {
    // 1. Foreground Location
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setForegroundLoc(status);
    } catch {
      setForegroundLoc('denied');
    }

    // 2. Background Location
    try {
      const { status } = await Location.getBackgroundPermissionsAsync();
      setBackgroundLoc(status);
    } catch {
      setBackgroundLoc('denied');
    }

    // 3. Notifications
    try {
      if (Platform.OS === 'web') {
        const granted = 'Notification' in window && window.Notification.permission === 'granted';
        setNotifications(granted ? 'granted' : 'denied');
      } else {
        const { status } = await Notifications.getPermissionsAsync();
        setNotifications(status);
      }
    } catch {
      setNotifications('denied');
    }
  };

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : (isRightHanded ? SIDEBAR_WIDTH : -SIDEBAR_WIDTH),
      duration: 250,
      useNativeDriver: true,
    }).start();

    if (visible) {
      void checkPermissions();
      if (defaultLegendExpanded) {
        setLegendExpanded(true);
        setPermissionsExpanded(false);
      }
    }
  }, [visible, isRightHanded, defaultLegendExpanded]);

  const handleRequestForeground = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setForegroundLoc(status);
      if (status === 'granted') {
        if (Platform.OS === 'web') alert('Permissão de localização concedida!');
        else Alert.alert('Sucesso', 'Permissão de localização em primeiro plano concedida.');
      } else {
        if (Platform.OS === 'web') alert('Permissão negada.');
        else Alert.alert('Aviso', 'Permissão de localização negada.');
      }
      void checkPermissions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestBackground = async () => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      setBackgroundLoc(status);
      if (status === 'granted') {
        if (Platform.OS === 'web') alert('Permissão de segundo plano concedida!');
        else Alert.alert('Sucesso', 'Permissão de localização em segundo plano concedida.');
      } else {
        if (Platform.OS === 'web') alert('Permissão de segundo plano negada.');
        else Alert.alert('Aviso', 'Permissão de localização em segundo plano negada.');
      }
      void checkPermissions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await NotificationFacade.solicitarPermissao();
    setNotifications(granted ? 'granted' : 'denied');
    if (granted) {
      if (Platform.OS === 'web') {
        alert('Notificações ativadas com sucesso!');
      } else {
        Alert.alert('Sucesso', 'Notificações ativadas com sucesso!');
      }
    } else {
      if (Platform.OS === 'web') {
        alert('Permissão de notificações negada.');
      } else {
        Alert.alert('Erro', 'Permissão de notificações negada.');
      }
    }
    void checkPermissions();
  };

  if (!visible) return null;

  return (
    <View style={styles.fullscreenOverlay} pointerEvents="box-none">
      {/* Backdrop closes sidebar on tap */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sliding Sidebar Panel */}
      <Animated.View
        style={[
          styles.panel,
          isRightHanded ? { right: 0 } : { left: 0 },
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configurações</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Container to avoid layout overflows */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {/* API Connection Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Status de Conexão</Text>
            <View style={styles.apiRow}>
              <View style={styles.statusGroup}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: backendStatus === 'online' ? '#10b981' : '#ef4444' },
                  ]}
                />
                <Text style={styles.statusText}>
                  {backendStatus === 'online' ? 'API Conectada' : 'Offline'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={onReloadReviews}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color="#2dd4bf" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Collapsible Menu List */}
          <View style={styles.menuGroup}>
            {/* Permissions Collapsible */}
            <TouchableOpacity
              style={[styles.menuItem, permissionsExpanded && styles.menuItemActive]}
              onPress={() => setPermissionsExpanded(!permissionsExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="key-outline" size={18} color="#2dd4bf" />
              </View>
              <Text style={styles.menuText}>Permissões</Text>
              <Ionicons name={permissionsExpanded ? "chevron-down" : "chevron-forward"} size={16} color="#64748b" />
            </TouchableOpacity>

            {permissionsExpanded && (
              <View style={styles.expandedContent}>
                {/* Foreground Location */}
                <View style={styles.permissionSubItem}>
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permission}>Localização (Mapa)</Text>
                    <Text style={styles.permission}>
                      {foregroundLoc === 'granted' ? '🟢 Ativo' : '🔴 Inativo'}
                    </Text>
                  </View>
                  {foregroundLoc !== 'granted' && (
                    <TouchableOpacity style={styles.activateBtn} onPress={handleRequestForeground}>
                      <Text style={styles.activateBtnText}>Ativar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Background Location */}
                <View style={styles.permissionSubItem}>
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permission}>Localização (Segundo Plano)</Text>
                    <Text style={styles.permission}>
                      {backgroundLoc === 'granted' ? '🟢 Ativo' : '🔴 Inativo'}
                    </Text>
                  </View>
                  {backgroundLoc !== 'granted' && (
                    <TouchableOpacity style={styles.activateBtn} onPress={handleRequestBackground}>
                      <Text style={styles.activateBtnText}>Ativar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Notifications */}
                <View style={styles.permissionSubItem}>
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permission}>Notificações</Text>
                    <Text style={styles.permission}>
                      {notifications === 'granted' ? '🟢 Ativo' : '🔴 Inativo'}
                    </Text>
                  </View>
                  {notifications !== 'granted' && (
                    <TouchableOpacity style={styles.activateBtn} onPress={handleRequestNotifications}>
                      <Text style={styles.activateBtnText}>Ativar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Colors Legend Collapsible */}
            <TouchableOpacity
              style={[styles.menuItem, legendExpanded && styles.menuItemActive, { borderTopWidth: 1, borderColor: '#1e293b' }]}
              onPress={() => setLegendExpanded(!legendExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="warning" size={18} color="#2dd4bf" />
              </View>
              <Text style={styles.menuText}>Indicadores de Risco</Text>
              <Ionicons name={legendExpanded ? "chevron-down" : "chevron-forward"} size={16} color="#64748b" />
            </TouchableOpacity>

            {legendExpanded && (
              <View style={styles.expandedContent}>
                {['AZUL', 'AMARELO', 'VERMELHO'].map((key) => {
                  const config = RiskVisualStrategy[key as RiskLevel];
                  return (
                    <View key={key} style={styles.legendSubItem}>
                      <View style={styles.legendTitleRow}>
                        <View style={[styles.legendIndicator, { backgroundColor: config.color }]} />
                        <Text style={styles.legendName}>{config.bannerText}</Text>
                      </View>
                      <Text style={styles.legendDesc}>{config.description}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Hand preference switch at the bottom */}
        <View style={[styles.sectionCard, styles.handPreferenceCard]}>
          <Text style={styles.sectionTitle}>Modo</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleSegment,
                isRightHanded && styles.toggleSegmentActive,
              ]}
              onPress={() => setIsRightHanded(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  isRightHanded && styles.toggleTextActive,
                ]}
              >
                Destro
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleSegment,
                !isRightHanded && styles.toggleSegmentActive,
              ]}
              onPress={() => setIsRightHanded(false)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  !isRightHanded && styles.toggleTextActive,
                ]}
              >
                Canhoto
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    elevation: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#1e293b',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  apiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGroup: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItemActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.05)',
  },
  menuIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  permissionSubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#1e293b',
  },
  permissionInfo: {
    flex: 1,
  },
  permission: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  activateBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activateBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  legendSubItem: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#1e293b',
  },
  legendTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: '700',
  },
  legendDesc: {
    color: '#64748b',
    fontSize: 10,
    lineHeight: 14,
  },
  handPreferenceCard: {
    marginTop: 'auto',
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 3,
  },
  toggleSegment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  toggleSegmentActive: {
    backgroundColor: '#0f766e',
  },
  toggleText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
});
