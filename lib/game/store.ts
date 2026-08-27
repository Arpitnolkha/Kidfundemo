'use client';

import { create } from 'zustand';
import type { Discovery } from '@/lib/characters/types';
import type { JungleSceneId } from '@/lib/jungle/types';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

type SessionState = {
  currentPage: 'home' | 'eggs' | 'jungle' | 'globe';
  selectedEggId: string | null;
  hatchedEggIds: string[];
  activeJungleEntityId: string | null;
  currentJungleScene: JungleSceneId;
  isJungleTransitioning: boolean;
  currentCharacterId: string | null;
  agoraConnectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  microphoneState: 'idle' | 'requesting' | 'granted' | 'denied';
  conversationState: VoiceState;
  discoveries: Discovery[];
  soundEnabled: boolean;
  lastSpokenLine: string;
  newDiscoveryId: string | null;
  setPage: (page: SessionState['currentPage']) => void;
  selectEgg: (eggId: string | null) => void;
  hatchEgg: (eggId: string) => void;
  selectJungleEntity: (entityId: string | null) => void;
  goToJungleScene: (sceneId: JungleSceneId) => void;
  setJungleTransitioning: (value: boolean) => void;
  setCurrentCharacter: (characterId: string | null) => void;
  setAgoraConnectionState: (state: SessionState['agoraConnectionState']) => void;
  setMicrophoneState: (state: SessionState['microphoneState']) => void;
  setConversationState: (state: VoiceState) => void;
  setLastSpokenLine: (line: string) => void;
  addDiscovery: (discovery: Discovery) => void;
  clearNewDiscovery: () => void;
  toggleSound: () => void;
  resetConversation: () => void;
};

export const useGameStore = create<SessionState>((set) => ({
  currentPage: 'home',
  selectedEggId: null,
  hatchedEggIds: [],
  activeJungleEntityId: null,
  currentJungleScene: 'scene1',
  isJungleTransitioning: false,
  currentCharacterId: null,
  agoraConnectionState: 'disconnected',
  microphoneState: 'idle',
  conversationState: 'idle',
  discoveries: [],
  soundEnabled: true,
  lastSpokenLine: '',
  newDiscoveryId: null,
  setPage: (page) => set({ currentPage: page }),
  selectEgg: (selectedEggId) => set({ selectedEggId }),
  hatchEgg: (eggId) =>
    set((state) => ({
      hatchedEggIds: state.hatchedEggIds.includes(eggId)
        ? state.hatchedEggIds
        : [...state.hatchedEggIds, eggId],
      selectedEggId: eggId,
      currentCharacterId: eggId,
    })),
  selectJungleEntity: (activeJungleEntityId) =>
    set({ activeJungleEntityId, currentCharacterId: activeJungleEntityId }),
  goToJungleScene: (currentJungleScene) => set({ currentJungleScene }),
  setJungleTransitioning: (isJungleTransitioning) => set({ isJungleTransitioning }),
  setCurrentCharacter: (currentCharacterId) => set({ currentCharacterId }),
  setAgoraConnectionState: (agoraConnectionState) => set({ agoraConnectionState }),
  setMicrophoneState: (microphoneState) => set({ microphoneState }),
  setConversationState: (conversationState) => set({ conversationState }),
  setLastSpokenLine: (lastSpokenLine) => set({ lastSpokenLine }),
  addDiscovery: (discovery) =>
    set((state) => {
      const exists = state.discoveries.some(
        (item) => item.entityId === discovery.entityId,
      );
      return exists
        ? state
        : {
            discoveries: [...state.discoveries, discovery],
            newDiscoveryId: discovery.entityId,
          };
    }),
  clearNewDiscovery: () => set({ newDiscoveryId: null }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  resetConversation: () =>
    set({
      agoraConnectionState: 'disconnected',
      microphoneState: 'idle',
      conversationState: 'idle',
      lastSpokenLine: '',
    }),
}));
