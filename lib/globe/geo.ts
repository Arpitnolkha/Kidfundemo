import worldLow from '@amcharts/amcharts5-geodata/worldLow';
import type { GlobeCountryOption } from '@/lib/globe/types';

export function getGlobeCountryOptions(): GlobeCountryOption[] {
  return worldLow.features
    .map((country) => ({
      id: String(country.id ?? ''),
      name: String(country.properties?.name ?? ''),
    }))
    .filter(
      (country) => country.id && country.id !== 'AQ' && country.name,
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}
