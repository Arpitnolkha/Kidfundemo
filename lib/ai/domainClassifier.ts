import { z } from 'zod';
import type { LearningCharacter } from '@/lib/characters/types';

export const domainRouteSchema = z.enum([
  'in_domain',
  'related_domain',
  'out_of_domain',
  'unsafe',
]);

export type DomainRoute = z.infer<typeof domainRouteSchema>;

const unsafePatterns = [
  'address',
  'phone number',
  'email',
  'where do you live',
  'blood',
  'kill',
  'weapon',
  'bomb',
  'sex',
  'nude',
  'vote',
];

const conceptAliases: Record<string, string[]> = {
  shells: ['armor', 'hard back', 'covering'],
  swimming: ['swim', 'water', 'ocean', 'sea', 'pond', 'river'],
  eggs: ['hatch', 'shell', 'nest', 'baby'],
  feathers: ['wings', 'soft body', 'plumage'],
  beaks: ['bill', 'mouth'],
  predators: ['shark', 'hawk', 'fox', 'hunter', 'enemy'],
  reptiles: ['cold-blooded', 'scaly'],
  movement: ['move', 'slither', 'crawl', 'jump', 'climb', 'swing'],
  flowers: ['petals', 'nectar', 'bloom'],
  roots: ['soil', 'drink water'],
  oxygen: ['air', 'breathe'],
};

const stopWords = new Set([
  'a',
  'an',
  'and',
  'are',
  'can',
  'do',
  'does',
  'for',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'or',
  'the',
  'to',
  'what',
  'where',
  'who',
  'why',
  'you',
  'your',
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

function tokenScore(text: string, terms: string[]): number {
  return terms.reduce((score, term) => {
    const key = normalize(term);
    const aliases = conceptAliases[key] ?? [];
    const candidates = [term, ...aliases];
    return (
      score +
      candidates.reduce((inner, candidate) => {
        const normalizedCandidate = normalize(candidate);
        if (!normalizedCandidate) return inner;
        if (text.includes(normalizedCandidate)) return inner + 2;
        const words = normalizedCandidate
          .split(/\s+/)
          .filter((word) => word && !stopWords.has(word) && word.length > 2);
        const partialHits = words.filter((word) => text.includes(word)).length;
        return inner + partialHits * 0.5;
      }, 0)
    );
  }, 0);
}

export function classifyDomainRoute(
  message: string,
  character: LearningCharacter,
): DomainRoute {
  const normalized = normalize(message);

  if (unsafePatterns.some((pattern) => normalized.includes(pattern))) {
    return 'unsafe';
  }

  const inDomainScore = tokenScore(normalized, character.allowedTopics);
  const relatedScore = tokenScore(normalized, character.relatedTopics);
  const redirectScore = tokenScore(normalized, character.starterQuestions);

  if (relatedScore >= 1.5) {
    return 'related_domain';
  }

  if (inDomainScore >= 2 || redirectScore >= 2) {
    return 'in_domain';
  }

  if (inDomainScore + relatedScore >= 2) {
    return 'related_domain';
  }

  return 'out_of_domain';
}

export function buildRedirectResponse(character: LearningCharacter): string {
  return `${character.redirectLine} Try one of these: ${character.starterQuestions
    .slice(0, 2)
    .join(' or ')}.`;
}
