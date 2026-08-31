import { describe, expect, it } from 'vitest';
import { eggCharacters } from '@/lib/characters/eggs';
import { buildCharacterPrompt } from '@/lib/ai/promptBuilder';
import { globeCountryGuidesByIso2 } from '@/lib/globe/countries';
import { jungleCharacters } from '@/lib/characters/jungle';

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
    expect(prompt).toContain("child's most recent ASR transcript");
    expect(prompt).toContain('Your character persona is female');
    expect(prompt).toContain('मैं बताऊँगी');
  });

  it('keeps globe guides feminine while matching the latest ASR language', () => {
    const prompt = buildCharacterPrompt(globeCountryGuidesByIso2.CN, {
      scene: 'globe',
      discoveries: 1,
    });

    expect(prompt).toContain("child's most recent ASR transcript");
    expect(prompt).toContain('Your guide persona is female');
    expect(prompt).toContain('मैं बताऊँगी');
    expect(prompt).toContain('मैं जानती हूँ');
    expect(prompt).toContain('respond in Hindi, English, or Hinglish');
  });

  it('keeps jungle characters feminine while matching the latest ASR language', () => {
    const prompt = buildCharacterPrompt(jungleCharacters[0], {
      scene: 'jungle',
      discoveries: 1,
    });

    expect(prompt).toContain("child's most recent ASR transcript");
    expect(prompt).toContain('Your character persona is female');
    expect(prompt).toContain('मैं बताऊँगी');
    expect(prompt).toContain('मैं जानती हूँ');
    expect(prompt).toContain('respond in Hindi, English, or Hinglish');
  });
});
