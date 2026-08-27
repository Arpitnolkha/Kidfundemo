import { eggCharactersById } from '@/lib/characters/eggs';
import { jungleCharactersById } from '@/lib/characters/jungle';
import { globeCountryGuidesById } from '@/lib/globe/countries';
import type { LearningCharacter } from '@/lib/characters/types';

export const charactersById: Record<string, LearningCharacter> = {
  ...eggCharactersById,
  ...jungleCharactersById,
  ...globeCountryGuidesById,
};

export function getCharacterById(id: string): LearningCharacter | undefined {
  return charactersById[id];
}
