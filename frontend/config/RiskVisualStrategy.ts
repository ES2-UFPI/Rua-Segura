import { Ionicons } from '@expo/vector-icons';

// Tipagem restrita para os níveis de risco que virão do backend
export type RiskLevel = 'AZUL' | 'AMARELO' | 'VERMELHO';

// Interface que define o contrato visual
export interface RiskVisualConfig {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  bannerText: string;
  description: string;
}

// Dicionário de configuração visual
export const RiskVisualStrategy: Record<RiskLevel, RiskVisualConfig> = {
  AZUL: {
    color: '#036D9A', 
    icon: 'shield-checkmark-outline',
    bannerText: 'Zona de Baixo Risco',
    description: 'Nenhuma criticidade reportada próxima. Transite com atenção habitual.',
  },
  AMARELO: {
    color: '#FDEA6F', 
    icon: 'warning-outline',
    bannerText: 'Zona de Atenção',
    description: 'Ocorrências moderadas detectadas por perto. Evite distrações e locais desertos.',
  },
  VERMELHO: {
    color: '#CF0000',
    icon: 'alert-circle-outline',
    bannerText: 'Zona Crítica',
    description: 'Elevada taxa de severidade e incidentes. Alerta máximo. Evite transitar a pé se possível.',
  },
};