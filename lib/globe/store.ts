'use client';

import { create } from 'zustand';

type GlobeState = {
  selectedCountryId: string | null;
  visitedCountryIds: string[];
  autoRotate: boolean;
  isDragging: boolean;
  openCountry: (countryId: string) => void;
  closeCountry: () => void;
  markVisited: (countryId: string) => void;
  setAutoRotate: (autoRotate: boolean) => void;
  setDragging: (isDragging: boolean) => void;
};

export const useGlobeStore = create<GlobeState>((set) => ({
  selectedCountryId: null,
  visitedCountryIds: [],
  autoRotate: true,
  isDragging: false,
  openCountry: (selectedCountryId) => set({ selectedCountryId }),
  closeCountry: () => set({ selectedCountryId: null }),
  markVisited: (countryId) =>
    set((state) => ({
      visitedCountryIds: state.visitedCountryIds.includes(countryId)
        ? state.visitedCountryIds
        : [...state.visitedCountryIds, countryId],
    })),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setDragging: (isDragging) => set({ isDragging }),
}));
