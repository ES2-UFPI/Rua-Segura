import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmReviewModalProps {
  visible: boolean;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
}

export default function ConfirmReviewModal({
  visible,
  category,
  description,
  latitude,
  longitude,
  onConfirm,
  onEdit,
  onClose,
}: ConfirmReviewModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Confirmar ocorrência?</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Categoria</Text>
            <Text style={styles.value}>{category}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Descrição</Text>
            <Text style={styles.value}>{description}</Text>
          </View>

          <View style={styles.row}> 
            <Text style={styles.label}>Latitude</Text>
            <Text style={styles.value}>{latitude.toFixed(5)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Longitude</Text>
            <Text style={styles.value}>{longitude.toFixed(5)}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.buttonEdit} onPress={onEdit}>
              <Ionicons name="pencil" size={16} color="#ffffff" />
              <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonConfirm} onPress={onConfirm}>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  value: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  buttonEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonConfirm: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
});
