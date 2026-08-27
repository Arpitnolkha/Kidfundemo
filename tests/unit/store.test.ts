import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/lib/game/store';
import { eggCharacters } from '@/lib/characters/eggs';

describe('game store actions', () => {
  beforeEach(() => {
    useGameStore.setState({
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
    });
  });

  it('hatches an egg and sets the active character', () => {
    useGameStore.getState().hatchEgg(eggCharacters[0].id);
    const state = useGameStore.getState();

    expect(state.hatchedEggIds).toContain(eggCharacters[0].id);
    expect(state.currentCharacterId).toBe(eggCharacters[0].id);
  });

  it('creates a discovery only once', () => {
    const discovery = eggCharacters[0].discovery;
    useGameStore.getState().addDiscovery(discovery);
    useGameStore.getState().addDiscovery(discovery);

    expect(useGameStore.getState().discoveries).toHaveLength(1);
    expect(useGameStore.getState().newDiscoveryId).toBe(discovery.entityId);
  });

  it('tracks jungle scene progress safely', () => {
    useGameStore.getState().goToJungleScene('scene4');
    useGameStore.getState().setJungleTransitioning(true);

    const state = useGameStore.getState();
    expect(state.currentJungleScene).toBe('scene4');
    expect(state.isJungleTransitioning).toBe(true);
  });
});
