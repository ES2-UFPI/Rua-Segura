import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
}

type StepType = 'confirm' | 'triggered' | 'cancelled';

export default function EmergencyModal({ visible, onClose }: EmergencyModalProps) {
  const [step, setStep] = useState<StepType>('confirm');
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reinicia os estados e limpa timers sempre que o modal abre ou fecha
  useEffect(() => {
    if (visible) {
      setStep('confirm');
      setTimeLeft(10);
    } else {
      clearTimers();
    }
  }, [visible]);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  };

  const startAutoCloseTimer = () => {
    clearTimers();
    setTimeLeft(10);

    // Fecha o modal automaticamente após 10 segundos
    timerRef.current = setTimeout(() => {
      onClose();
    }, 10000);

    // Atualiza a contagem regressiva de segundos no painel a cada segundo
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleConfirm = () => {
    setStep('triggered');
    startAutoCloseTimer();
  };

  const handleCancel = () => {
    setStep('cancelled');
    startAutoCloseTimer();
  };

  const handleManualClose = () => {
    clearTimers();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleManualClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {step === 'confirm' && (
            <>
              <View style={styles.iconContainerConfirm}>
                <Ionicons name="alert-circle" size={56} color="#ef4444" />
              </View>
              <Text style={styles.title}>Confirmar Emergência</Text>
              <Text style={styles.description}>
                Tem certeza que deseja acionar o botão de emergência?
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.buttonCancel} onPress={handleCancel} activeOpacity={0.8}>
                  <Text style={styles.buttonTextCancel}>Não</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonConfirm} onPress={handleConfirm} activeOpacity={0.8}>
                  <Text style={styles.buttonTextConfirm}>Sim</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'triggered' && (
            <>
              <View style={styles.iconContainerSuccess}>
                <Ionicons name="shield-checkmark" size={56} color="#10b981" />
              </View>
              <Text style={styles.title}>Emergência Acionada</Text>
              <Text style={styles.description}>
                Botão de emergência acionado!{"\n"}(Ação apenas estética nesta sprint).
              </Text>
              <Text style={styles.timerText}>Fechando em {timeLeft}s...</Text>
              <TouchableOpacity style={styles.buttonClose} onPress={handleManualClose} activeOpacity={0.8}>
                <Text style={styles.buttonCloseText}>Fechar</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'cancelled' && (
            <>
              <View style={styles.iconContainerCancel}>
                <Ionicons name="close-circle" size={56} color="#94a3b8" />
              </View>
              <Text style={styles.title}>Acionamento Cancelado</Text>
              <Text style={styles.description}>
                O acionamento do botão de emergência foi cancelado.
              </Text>
              <Text style={styles.timerText}>Fechando em {timeLeft}s...</Text>
              <TouchableOpacity style={styles.buttonClose} onPress={handleManualClose} activeOpacity={0.8}>
                <Text style={styles.buttonCloseText}>Fechar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Overlay escuro correspondente ao estilo do app
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1e293b', // slate-800
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#334155', // slate-700
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainerConfirm: {
    marginBottom: 14,
  },
  iconContainerSuccess: {
    marginBottom: 14,
  },
  iconContainerCancel: {
    marginBottom: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    color: '#cbd5e1', // slate-300
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  timerText: {
    color: '#94a3b8', // slate-400
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  buttonCancel: {
    flex: 1,
    backgroundColor: '#334155', // slate-700
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  buttonConfirm: {
    flex: 1,
    backgroundColor: '#dc2626', // red-600
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  buttonTextCancel: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonTextConfirm: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  buttonClose: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#475569',
  },
  buttonCloseText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});
