export enum BidType {
  NewPoint = 'new_point',
  DirectResponse = 'direct_response',
  Counter = 'counter',
  FollowUpQuestion = 'follow_up_question',
  Synthesis = 'synthesis',
  Redirect = 'redirect',
}

export enum SessionPhase {
  Configuring = 'configuring',
  Opening = 'opening',
  MainLoop = 'main_loop',
  Closing = 'closing',
  Completed = 'completed',
}

export enum UtteranceType {
  HostOpening = 'host_opening',
  ParticipantOpening = 'participant_opening',
  HostFacilitation = 'host_facilitation',
  ParticipantResponse = 'participant_response',
  HostClosing = 'host_closing',
  HostNarrow = 'host_narrow',
}

export enum CheckpointAction {
  Continue = 'continue',
  Narrow = 'narrow',
  Conclude = 'conclude',
}

export enum LlmProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
}
