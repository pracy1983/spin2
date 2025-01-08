import { SpinPhase, SpinPhaseConfig } from './types';

export const SPIN_PHASES: Record<SpinPhase, SpinPhaseConfig> = {
  SITUATION: {
    id: '1',
    label: 'Situação',
    color: 'blue-500',
    description: 'Coleta de informações sobre o contexto atual'
  },
  PROBLEM: {
    id: '2',
    label: 'Problema',
    color: 'yellow-500',
    description: 'Identificação de dificuldades e desafios'
  },
  IMPLICATION: {
    id: '3',
    label: 'Implicação',
    color: 'orange-500',
    description: 'Exploração das consequências dos problemas'
  },
  NEED_PAYOFF: {
    id: '4',
    label: 'Necessidade',
    color: 'green-500',
    description: 'Visualização dos benefícios da solução'
  }
};
