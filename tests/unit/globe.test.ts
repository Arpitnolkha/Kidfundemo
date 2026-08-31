import { beforeEach, describe, expect, it } from 'vitest';
import { buildCharacterPrompt } from '@/lib/ai/promptBuilder';
import {
  globeCountryGuides,
  globeCountryGuidesByIso2,
} from '@/lib/globe/countries';
import { getGlobeCountryOptions } from '@/lib/globe/geo';
import { useGlobeStore } from '@/lib/globe/store';

describe('globe exploration', () => {
  beforeEach(() => {
    useGlobeStore.setState({
      selectedCountryId: null,
      visitedCountryIds: [],
      autoRotate: true,
      isDragging: false,
    });
  });

  it('provides a complete and uniquely mapped guide for every selectable country', () => {
    const countries = getGlobeCountryOptions();

    expect(globeCountryGuides).toHaveLength(countries.length);
    expect(new Set(globeCountryGuides.map((guide) => guide.iso2)).size).toBe(
      countries.length,
    );

    for (const guide of globeCountryGuides) {
      expect(guide.agentEnabled).toBe(true);
      expect(guide.allowedTopics.length).toBeGreaterThan(5);
      expect(guide.starterQuestions).toHaveLength(3);
      expect(globeCountryGuidesByIso2[guide.iso2]).toBe(guide);
    }
  });

  it('creates a conversational guide for countries outside the featured set', () => {
    const china = globeCountryGuidesByIso2.CN;
    const nepal = globeCountryGuidesByIso2.NP;

    expect(china.title).toBe('Explore China');
    expect(china.id).toBe('country-CN');
    expect(china.allowedTopics).toContain('China geography');
    expect(nepal.title).toBe('Explore Nepal');
  });

  it('uses real atlas features for every enabled guide', () => {
    const countryIds = new Set(
      getGlobeCountryOptions().map((country) => country.id),
    );

    for (const guide of globeCountryGuides) {
      expect(countryIds.has(guide.iso2)).toBe(true);
    }
  });

  it('keeps each guide scoped to its active country', () => {
    const india = globeCountryGuidesByIso2.IN;
    const prompt = buildCharacterPrompt(india, {
      scene: 'globe',
      discoveries: 2,
    });

    expect(prompt).toContain('ACTIVE COUNTRY GUIDE');
    expect(prompt).toContain('OTHER_COUNTRY');
    expect(prompt).toContain('spin the globe');
    expect(prompt).toContain('politically');
    expect(prompt).toContain('explored 2 countries');
  });

  it('tracks selection and visits without duplicates', () => {
    const store = useGlobeStore.getState();
    store.openCountry('IN');
    store.markVisited('IN');
    store.markVisited('IN');

    expect(useGlobeStore.getState().selectedCountryId).toBe('IN');
    expect(useGlobeStore.getState().visitedCountryIds).toEqual(['IN']);

    useGlobeStore.getState().closeCountry();
    expect(useGlobeStore.getState().selectedCountryId).toBeNull();
  });
});
