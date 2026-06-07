import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// As 9 labels negativas do guia arquitetural
const RISK_LABELS = [
  { label: 'Assalto', icon: 'shield-outline', color: '#e11d48' },
  { label: 'Furto', icon: 'magnet-outline', color: '#f43f5e' },
  { label: 'Assédio', icon: 'hand-left-outline', color: '#db2777' },
  { label: 'Iluminação ruim', icon: 'flashlight-outline', color: '#d97706' },
  { label: 'Infraestrutura inadequada', icon: 'construct-outline', color: '#4b5563' },
  { label: 'Movimentação suspeita', icon: 'eye-outline', color: '#7c3aed' },
  { label: 'Perseguição/stalking', icon: 'footsteps-outline', color: '#2563eb' },
  { label: 'Briga/agressão', icon: 'people-outline', color: '#dc2626' },
  { label: 'Local deserto', icon: 'walk-outline', color: '#059669' },
];

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (category: string, description: string) => Promise<void>;
  latitude: number;
  longitude: number;
}

export default function ReviewModal({
  visible,
  onClose,
  onSubmit,
  latitude,
  longitude,
}: ReviewModalProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selectedLabel) {
      setErrorMsg('Por favor, selecione uma etiqueta de risco.');
      return;
    }
    if (!comment.trim()) {
      setErrorMsg('Por favor, insira um comentário sobre o local.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      await onSubmit(selectedLabel, comment);
      // Reset state on success
      setSelectedLabel(null);
      setComment('');
      onClose();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Falha ao salvar a avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        
        {/* Backdrop clickable to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.bottomSheet}>
          <View style={styles.dragIndicator} />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Avaliar Segurança Local</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#808080" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Coordinate info card */}
            <View style={styles.locationCard}>
              <Ionicons name="location-sharp" size={18} color="#0f766e" />
              <Text style={styles.locationText}>
                Coordenadas selecionadas:{' '}
                <Text style={styles.coordsHighlight}>
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </Text>
              </Text>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#b42318" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Section: Labels */}
            <Text style={styles.sectionTitle}>Selecione a característica do local:</Text>
            <View style={styles.chipsContainer}>
              {RISK_LABELS.map((item) => {
                const isSelected = selectedLabel === item.label;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.chip,
                      isSelected && { backgroundColor: item.color, borderColor: item.color },
                    ]}
                    onPress={() => {
                      setSelectedLabel(item.label);
                      setErrorMsg(null);
                    }}>
                    <Ionicons
                      name={item.icon as any}
                      size={16}
                      color={isSelected ? '#ffffff' : '#4b5563'}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section: Comments */}
            <Text style={styles.sectionTitle}>Comentários sobre o local:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Descreva o que acontece neste local ou a situação..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={(text) => {
                setComment(text);
                setErrorMsg(null);
              }}
            />

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={submitting}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => void handleSave()}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Registrar Ocorrência</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#1e293b', // Slate 800 dark mode background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  coordsHighlight: {
    fontWeight: '700',
    color: '#2dd4bf',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(180, 35, 24, 0.1)',
    borderWidth: 1,
    borderColor: '#b42318',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  cancelButtonText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0f766e',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
