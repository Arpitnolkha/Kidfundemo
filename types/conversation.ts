import type { RTMClient } from 'agora-rtm';
import type { ReactNode } from 'react';
import type { LearningCharacter } from '@/lib/characters/types';

export interface AgoraTokenData {
  token: string;
  uid: string;
  channel: string;
  agentId?: string;
}

export interface ClientStartRequest {
  requester_id: string;
  channel_name: string;
}

export interface StopConversationRequest {
  agent_id: string;
}

export interface AgentResponse {
  agent_id: string;
  create_ts: number;
  state: string;
}

export interface AgoraRenewalTokens {
  rtcToken: string;
  rtmToken: string;
}

export interface ConversationComponentProps {
  agoraData: AgoraTokenData;
  rtmClient: RTMClient;
  onTokenWillExpire: (uid: string) => Promise<AgoraRenewalTokens>;
  onEndConversation: () => void;
  visualizerOverride?: ReactNode;
  uiMode?: 'default' | 'storybook';
  character?: LearningCharacter;
  scene?: 'eggs' | 'jungle' | 'globe';
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  showDebug?: boolean;
  showLatencyDebug?: boolean;
}
