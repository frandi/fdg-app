export const bidSchema = {
  type: 'object' as const,
  properties: {
    bidType: {
      type: 'string' as const,
      enum: [
        'new_point',
        'direct_response',
        'counter',
        'follow_up_question',
        'synthesis',
        'redirect',
      ],
      description: 'The type of bid being submitted',
    },
    summary: {
      type: 'string' as const,
      description:
        'A brief 1-2 sentence summary of what you intend to say if granted the floor',
    },
  },
  required: ['bidType', 'summary'] as const,
  additionalProperties: false,
};
