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
      type: 'string' as const,
      description:
        'Optional facilitation comment or steering statement. Required if action is "narrow".',
    },
  },
  required: ['action'] as const,
  additionalProperties: false,
};
