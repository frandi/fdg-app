export const evaluationSchema = {
  type: 'object' as const,
  properties: {
    selectedParticipantId: {
      type: 'string' as const,
      description: 'The ID of the participant selected to speak',
    },
    reasoning: {
      type: 'string' as const,
      description:
        'Brief reasoning for why this participant was selected, considering goal alignment, relevance, novelty, conversation flow, diversity of voice, and bid type balance',
    },
  },
  required: ['selectedParticipantId', 'reasoning'] as const,
  additionalProperties: false,
};
