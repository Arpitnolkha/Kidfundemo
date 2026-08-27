import type { LearningCharacter } from '@/lib/characters/types';

export type GlobeCountryGuide = LearningCharacter & {
  kind: 'globe';
  iso2: string;
  iso3: string;
  continent: string;
  centroid: [longitude: number, latitude: number];
  agentEnabled: true;
};

export type GlobeCountryOption = {
  id: string;
  name: string;
};

export type GlobeCountrySelection = {
  id: string;
  name: string;
  guide?: GlobeCountryGuide;
};
