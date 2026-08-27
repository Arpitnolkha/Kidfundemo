import { describe, expect, it } from 'vitest';
import { eggCharacters } from '@/lib/characters/eggs';
import {
  buildRedirectResponse,
  classifyDomainRoute,
} from '@/lib/ai/domainClassifier';

describe('domain routing', () => {
  const turtle = eggCharacters[1];

  it('accepts in-domain turtle questions', () => {
    expect(classifyDomainRoute('Why do turtles have shells?', turtle)).toBe(
      'in_domain',
    );
  });

  it('accepts related-domain predator questions', () => {
    expect(classifyDomainRoute('Do sharks eat turtles?', turtle)).toBe(
      'related_domain',
    );
  });

  it('redirects unrelated questions', () => {
    expect(classifyDomainRoute('How far is Mars?', turtle)).toBe(
      'out_of_domain',
    );
    expect(buildRedirectResponse(turtle)).toContain(turtle.redirectLine);
  });
});

