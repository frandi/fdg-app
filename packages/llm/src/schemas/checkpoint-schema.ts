export const checkpointSchema = {
  type: 'object' as const,
  properties: {
    action: {
      type: 'string' as const,
      enum: ['continue', 'narrow', 'conclude'],
      description:
        'The action to take: continue the discussion, narrow the topic with a steering statement, or conclude',
    },
    comment: {
      type: ['string', 'null'] as const,
      description:
        'Facilitation comment or steering statement. Required if action is "narrow"; otherwise may be null.',
    },
  },
  required: ['action', 'comment'] as const,
  additionalProperties: false,
};
