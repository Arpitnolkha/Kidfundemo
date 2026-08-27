import { buildRedirectResponse, classifyDomainRoute } from '@/lib/ai/domainClassifier';
import type { LearningCharacter } from '@/lib/characters/types';

const answerPatterns = [
  'Great question! ',
  'I know this one. ',
  'Let me tell you. ',
];

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

export function buildMockReply(
  character: LearningCharacter,
  question: string,
): string {
  const route = classifyDomainRoute(question, character);

  if (route === 'unsafe') {
    return `${character.redirectLine} Let's stick to safe, curious questions about ${character.allowedTopics[0]}.`;
  }

  if (route === 'out_of_domain') {
    return buildRedirectResponse(character);
  }

  const seed = question.length;
  const opener = pick(answerPatterns, seed);
  const fact = pick(character.funFacts, seed + 1);
  const followUp = pick(character.starterQuestions, seed + 2);

  return `${opener}${fact} You can ask me something like "${followUp}" too.`;
}

