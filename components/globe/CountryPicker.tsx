'use client';

import type { GlobeCountryOption } from '@/lib/globe/types';

export function CountryPicker({
  countries,
  selectedCountryId,
  onSelect,
}: {
  countries: GlobeCountryOption[];
  selectedCountryId: string | null;
  onSelect: (countryId: string, countryName: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-bold text-slate-700 sm:flex-row sm:items-center">
      <span className="shrink-0">Choose a country</span>
      <select
        value={selectedCountryId ?? ''}
        onChange={(event) => {
          const option = event.currentTarget.selectedOptions[0];
          if (event.target.value && option) onSelect(event.target.value, option.text);
        }}
        className="min-h-12 min-w-0 flex-1 rounded-full border-0 bg-white px-4 py-2.5 font-semibold text-slate-800 shadow-[0_10px_24px_rgba(10,35,66,0.15)] outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/75"
        aria-label="Choose a country to explore"
      >
        <option value="">Select a country...</option>
        {countries.map((country) => (
          <option key={country.id} value={country.id}>
            {country.name}
          </option>
        ))}
      </select>
    </label>
  );
}
