import { describe, expect, it } from 'vitest';
import { eggCharacters } from '@/lib/characters/eggs';
import { buildCharacterPrompt } from '@/lib/ai/promptBuilder';

describe('buildCharacterPrompt', () => {
  it('includes egg-specific identity, boundaries, and safety sections', () => {
    const prompt = buildCharacterPrompt(eggCharacters[1], {
      scene: 'eggs',
      discoveries: 2,
    });

    expect(prompt).toContain(`You are ${eggCharacters[1].name}, a friendly newly hatched`);
    expect(prompt).toContain('FIRST MESSAGE AFTER HATCHING');
    expect(prompt).toContain('OUT_OF_DOMAIN');
    expect(prompt).toContain('REPRODUCTION OR SEX-RELATED QUESTIONS');
    expect(prompt).toContain('That\'s something a grown-up can help explain');
    expect(prompt).toContain('The child has made 2 discoveries');
  });
});
