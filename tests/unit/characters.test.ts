import { describe, expect, it } from 'vitest';
import { eggCharacters } from '@/lib/characters/eggs';
import { jungleCharacters } from '@/lib/characters/jungle';

describe('character configuration', () => {
  it('keeps every egg character fully populated', () => {
    for (const character of eggCharacters) {
      expect(character.allowedTopics.length).toBeGreaterThan(3);
      expect(character.starterQuestions.length).toBeGreaterThanOrEqual(4);
      expect(character.funFacts.length).toBeGreaterThan(0);
      expect(character.voiceIntro).toContain(character.name);
    }
  });

  it('keeps the jungle scene richly populated', () => {
    expect(jungleCharacters.length).toBeGreaterThanOrEqual(10);
    for (const character of jungleCharacters) {
      expect(character.targetSize).toBeGreaterThan(70);
      expect(character.discovery.summary.length).toBeGreaterThan(10);
    }
  });
});

