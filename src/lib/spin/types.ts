export type SpinPhase = 'SITUATION' | 'PROBLEM' | 'IMPLICATION' | 'NEED_PAYOFF';

export interface SpinPhaseConfig {
  id: string;        // Mantendo compatibilidade com o sistema existente
  label: string;     // Nome em português da fase
  color: string;     // Cor do Tailwind (mantendo padrão existente)
  description: string;
}

export interface SpinSuggestion {
  text: string;      // A pergunta sugerida
  phase: SpinPhase;  // A fase do SPIN
}
