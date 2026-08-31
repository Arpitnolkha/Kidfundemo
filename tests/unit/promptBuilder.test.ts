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
    expect(prompt).toContain('UNRELATED');
    expect(prompt).toContain('REPRODUCTION OR SEX-RELATED QUESTIONS');
    expect(prompt).toContain('That\'s something a grown-up can help explain');
    expect(prompt).toContain('The child has made 2 discoveries');
    expect(prompt).toContain("child's most recent ASR transcript");
    expect(prompt).toContain('Your character persona is consistently female');
    expect(prompt).toContain('मैं बताऊँगी');
    expect(prompt).toContain('interpret "turtle shell why"');
    expect(prompt).toContain('FOLLOW-UP CONTEXT');
    expect(prompt).toContain('invite her to use the Globe');
  });

  it('keeps globe guides feminine while matching the latest ASR language', () => {
    const prompt = buildCharacterPrompt(globeCountryGuidesByIso2.CN, {
      scene: 'globe',
      discoveries: 1,
    });

    expect(prompt).toContain("child's most recent ASR transcript");
    expect(prompt).toContain('Your guide persona is consistently female');
    expect(prompt).toContain('मैं बताऊँगी');
    expect(prompt).toContain('मैं जानती हूँ');
    expect(prompt).toContain('respond in Hindi, English, or Hinglish');
  });

  it('treats administrative divisions, long lists, and ASR fragments as valid country questions', () => {
    const indiaPrompt = buildCharacterPrompt(globeCountryGuidesByIso2.IN, {
      scene: 'globe',
      discoveries: 2,
    });
    const unitedStatesPrompt = buildCharacterPrompt(
      globeCountryGuidesByIso2.US,
      { scene: 'globe', discoveries: 2 },
    );

    expect(indiaPrompt).toContain('The active selected country is India');
    expect(indiaPrompt).toContain('ADMINISTRATIVE DIVISIONS ARE ALWAYS IN SCOPE');
    expect(indiaPrompt).toContain('states, provinces, territories, Union Territories');
    expect(indiaPrompt).toContain('provide the complete list accurately');
    expect(indiaPrompt).toContain('interpret "india states name"');
    expect(indiaPrompt).toContain('interpret "Name them"');
    expect(unitedStatesPrompt).toContain(
      'The active selected country is the United States',
    );
    expect(unitedStatesPrompt).toContain(
      'Questions about the number or names of states',
    );
  });

  it('keeps generated country guides learning-focused and redirects only genuine unrelated questions', () => {
    const chinaPrompt = buildCharacterPrompt(globeCountryGuidesByIso2.CN, {
      scene: 'globe',
      discoveries: 3,
    });

    expect(chinaPrompt).toContain('female educational guide for China');
    expect(chinaPrompt).toContain('The child is under 13');
    expect(chinaPrompt).toContain(
      'Only use an unrelated redirect when the question is genuinely unrelated to China',
    );
    expect(chinaPrompt).toContain(
      'If the child asks primarily about another country',
    );
    expect(chinaPrompt).toContain(
      'Never invent a country fact, administrative division, capital, or list item',
    );
  });

  it('keeps jungle characters feminine while matching the latest ASR language', () => {
    const prompt = buildCharacterPrompt(jungleCharacters[0], {
      scene: 'jungle',
      discoveries: 1,
    });

    expect(prompt).toContain("child's most recent ASR transcript");
    expect(prompt).toContain('Your character persona is consistently female');
    expect(prompt).toContain('मैं बताऊँगी');
    expect(prompt).toContain('मैं जानती हूँ');
    expect(prompt).toContain('respond in Hindi, English, or Hinglish');
    expect(prompt).toContain('interpret "monkey eat what"');
    expect(prompt).toContain('ecosystem question as RELATED_DOMAIN');
    expect(prompt).toContain('invite her to use the Globe');
  });

  it('adds wild-mushroom safety only to the mushroom entity prompt', () => {
    const mushroom = jungleCharacters.find((character) =>
      /mushroom/i.test(character.title),
    );
    expect(mushroom).toBeDefined();

    const mushroomPrompt = buildCharacterPrompt(mushroom!, {
      scene: 'jungle',
      discoveries: 1,
    });
    const butterflyPrompt = buildCharacterPrompt(jungleCharacters[0], {
      scene: 'jungle',
      discoveries: 1,
    });

    expect(mushroomPrompt).toContain('MUSHROOM SAFETY');
    expect(mushroomPrompt).toContain('Never eat a wild mushroom');
    expect(butterflyPrompt).not.toContain('MUSHROOM SAFETY');
  });
});
