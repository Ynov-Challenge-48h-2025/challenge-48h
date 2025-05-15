import type { GeoJSON, Path } from 'leaflet';

export type DisasterType = 'none' | 'seisme' | 'inondation' | 'both';
export type Disaster = "earthquake" | "flood" | "none";

export interface ZoneData {
  date: string;
  district: "Zone 2" | "Zone 3" | "Zone 4";
  temperature: number;
  humidity: number;
  average_wind_speed: number;
  max_wind_speed: number;
  max_rain_intensity: number;
  total_rain: number;
  seismicity: number;
  gas_concentration: number;
  disaster: Disaster | Disaster[];
}

export interface District {
  id: number;
  name: string;
  disaster: DisasterType;
  zone: number;
}

export interface ArrondissementData {
  feature: GeoJSON.Feature;
  layer: Path | null;
}

export interface GeoJSONData {
  features: Array<{
    type: string;
    properties: {
      nom: string;
    };
    geometry: GeoJSON.Geometry;
  }>;
}

export const DISASTER_TYPES: Record<string, DisasterType> = {
  NONE: 'none',
  SEISME: 'seisme',
  INONDATION: 'inondation',
  BOTH: 'both'
};

export const ZONE_CONFIG = {
  2: {
    name: "Zone 2",
    arrondissements: [9, 5],
    disaster: DISASTER_TYPES.NONE
  },
  3: {
    name: "Zone 3",
    arrondissements: [4, 1, 2],
    disaster: DISASTER_TYPES.NONE
  },
  4: {
    name: "Zone 4",
    arrondissements: [3, 6, 7, 8],
    disaster: DISASTER_TYPES.NONE
  }
}; 