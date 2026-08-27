export type CharacterCategory =
  | 'animal'
  | 'bird'
  | 'insect'
  | 'plant'
  | 'fungus'
  | 'nature'
  | 'country';

export type Discovery = {
  entityId: string;
  title: string;
  summary: string;
};

export type LearningCharacter = {
  id: string;
  name: string;
  species?: string;
  title: string;
  imageSrc?: string;
  category: CharacterCategory;
  habitat?: string;
  emoji: string;
  personality: string;
  introduction: string;
  voiceIntro: string;
  voicePrompt: string;
  allowedTopics: string[];
  relatedTopics: string[];
  prohibitedTopics: string[];
  starterQuestions: string[];
  funFacts: string[];
  redirectLine: string;
  discovery: Discovery;
  palette: {
    shell: string;
    body: string;
    accent: string;
    glow: string;
  };
};

export type EggCharacter = LearningCharacter & {
  kind: 'egg';
  eggLabel: string;
  hatchVerb: string;
};

export type JungleCharacter = LearningCharacter & {
  kind: 'jungle';
  x: string;
  y: string;
  scale: number;
  layer: 'back' | 'mid' | 'front';
  targetSize: number;
};

export type { GlobeCountryGuide } from '@/lib/globe/types';
