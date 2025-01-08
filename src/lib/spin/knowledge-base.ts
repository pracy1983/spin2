import { SpinPhase } from './types';

interface SpinKnowledge {
  phase: SpinPhase;
  indicators: string[];
  examples: string[];
  clientResponses: string[];
}

export const SPIN_KNOWLEDGE: SpinKnowledge[] = [
  {
    phase: 'SITUATION',
    indicators: [
      'Respostas descritivas, neutras',
      'Cliente fornecendo informações básicas',
      'Foco em fatos e dados atuais'
    ],
    examples: [
      'Qual sistema vocês utilizam para gerenciar [processo X] hoje?',
      'Há quanto tempo vocês adotam essa abordagem para [atividade Y]?',
      'Quantas pessoas estão envolvidas no processo de [área relevante]?'
    ],
    clientResponses: [
      'Usamos o sistema X, mas ele é básico',
      'Fazemos manualmente, mas estamos pensando em mudar',
      'É algo que a equipe de operações cuida atualmente'
    ]
  },
  {
    phase: 'PROBLEM',
    indicators: [
      'Cliente reconhece dificuldades',
      'Demonstração de frustração',
      'Menção a desafios específicos'
    ],
    examples: [
      'Quais desafios vocês enfrentam ao usar o sistema atual?',
      'Essa abordagem atual já causou atrasos ou custos adicionais?',
      'Você sente que a equipe consegue trabalhar com eficiência com essa ferramenta?'
    ],
    clientResponses: [
      'Sim, frequentemente enfrentamos problemas com integrações',
      'O sistema não atende bem quando a demanda aumenta',
      'Acho que perdemos tempo ajustando coisas que poderiam ser automáticas'
    ]
  },
  {
    phase: 'IMPLICATION',
    indicators: [
      'Cliente reflete sobre impactos',
      'Preocupação com consequências',
      'Reconhecimento da urgência'
    ],
    examples: [
      'E como isso impacta a produtividade da equipe?',
      'Qual o custo de continuar com essa abordagem?',
      'Isso já afetou o atendimento a clientes ou outras áreas?'
    ],
    clientResponses: [
      'Sim, a equipe perde horas tentando consertar esses erros',
      'Estamos gastando mais do que o planejado com soluções manuais',
      'Isso acaba prejudicando os prazos de entrega para os nossos clientes'
    ]
  },
  {
    phase: 'NEED_PAYOFF',
    indicators: [
      'Cliente visualiza benefícios',
      'Interesse em soluções',
      'Otimismo sobre mudanças'
    ],
    examples: [
      'Como seria se vocês eliminassem esses atrasos?',
      'Se vocês conseguissem automatizar esse processo, qual seria o impacto no dia a dia?',
      'Com uma solução que resolvesse isso, vocês poderiam investir tempo em outras áreas importantes?'
    ],
    clientResponses: [
      'Isso nos ajudaria a cumprir prazos e melhorar a satisfação dos clientes',
      'Teríamos mais tempo para focar em estratégias de crescimento',
      'Resolver isso faria uma diferença enorme na produtividade'
    ]
  }
];
