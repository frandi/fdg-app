export const summarySchema = {
  type: 'object' as const,
  properties: {
    topicAndGoal: {
      type: 'string' as const,
      description: 'Restatement of what was discussed and what was intended',
    },
    keyPositions: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          participantName: { type: 'string' as const },
          position: { type: 'string' as const },
        },
        required: ['participantName', 'position'] as const,
        additionalProperties: false,
      },
      description: "Summary of each participant's core stance or contribution",
    },
    pointsOfAgreement: {
      type: 'array' as const,
      items: { type: 'string' as const },
      description: 'Where participants converged',
    },
    pointsOfContention: {
      type: 'array' as const,
      items: { type: 'string' as const },
      description:
        'Where participants disagreed and the nature of the disagreement',
    },
    emergingConsensus: {
      type: ['string', 'null'] as const,
      description:
        'Any conclusions or directions the group moved toward, or null if none',
    },
    unresolvedQuestions: {
      type: 'array' as const,
      items: { type: 'string' as const },
      description: 'What remains open or unanswered',
    },
    recommendation: {
      type: ['string', 'null'] as const,
      description:
        "If the goal was decision-oriented, the host's assessment of the best path forward, or null",
    },
  },
  required: [
    'topicAndGoal',
    'keyPositions',
    'pointsOfAgreement',
    'pointsOfContention',
    'emergingConsensus',
    'unresolvedQuestions',
    'recommendation',
  ] as const,
  additionalProperties: false,
};
