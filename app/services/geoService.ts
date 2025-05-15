'use client';

import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON } from 'leaflet';
import { ArrondissementData, District, GeoJSONData, ZONE_CONFIG, DISASTER_TYPES } from '@/app/types';
import { getLeafletStyle } from '@/app/components/Map/mapUtils';

const CONFIG = {
  apiUrl: "https://data.grandlyon.com/geoserver/metropole-de-lyon/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=metropole-de-lyon:adr_voie_lieu.adrarrond&outputFormat=application/json&SRSNAME=EPSG:4326"
};

export async function fetchGeoData(mapInstance: LeafletMap) {
  try {
    const L = (await import('leaflet')).default;
    
    const response = await fetch(CONFIG.apiUrl);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json() as GeoJSONData;
    
    if (!data || !data.features || data.features.length === 0) {
      throw new Error("Données GeoJSON invalides ou vides");
    }
    
    const arrondData: Record<number, ArrondissementData> = {};
    const districtsList: District[] = [];
    
    data.features.forEach(feature => {
      const properties = feature.properties;
      
      if (properties && properties.nom) {
        const arrondMatch = properties.nom.match(/(\d+)/);
        
        if (arrondMatch) {
          const arrondNumber = parseInt(arrondMatch[1], 10);
          const arrondName = properties.nom;
          
          let zone = 0;
          let disaster = DISASTER_TYPES.NONE;
          
          for (const [zoneId, config] of Object.entries(ZONE_CONFIG)) {
            if (config.arrondissements.includes(arrondNumber)) {
              zone = parseInt(zoneId);
              disaster = config.disaster;
              break;
            }
          }
          
          arrondData[arrondNumber] = {
            feature: {
              type: 'Feature',
              properties: feature.properties,
              geometry: feature.geometry
            },
            layer: null
          };
          
          districtsList.push({
            id: arrondNumber,
            name: arrondName,
            disaster: disaster,
            zone: zone
          });
        }
      }
    });
    
    districtsList.sort((a, b) => a.id - b.id);
    
    await createGeoLayers(mapInstance, arrondData, districtsList, L);
    
    return { arrondissements: arrondData, districts: districtsList };
  } catch (err) {
    console.error("Erreur lors de la récupération des données:", err);
    throw err;
  }
}

async function createGeoLayers(
  mapInstance: LeafletMap,
  arrondData: Record<number, ArrondissementData>,
  districts: District[],
  L: any
) {
  for (const arrondNumber in arrondData) {
    const district = districts.find(d => d.id === parseInt(arrondNumber, 10));
    const feature = arrondData[arrondNumber].feature;
    
    const style = getLeafletStyle(district?.disaster || DISASTER_TYPES.NONE, district?.zone || 0);
    
    const layer = L.geoJSON(feature, {
      style: style,
      onEachFeature: (feature: GeoJSON.Feature, layer: LeafletGeoJSON) => {
        if (feature.properties?.nom) {
          layer.bindPopup(`<b>${feature.properties.nom}</b>`);
        }
        
        layer.on({
          // mouseover: (e: { target: LeafletGeoJSON }) => {
          //   const layer = e.target;
          //   layer.setStyle({
          //     weight: 5,
          //     opacity: 0.8
          //   });
          // },
          
          click: (e: { target: LeafletGeoJSON }) => {
            const geoJSONLayer = e.target as unknown as any;
            const bounds = geoJSONLayer.getBounds();
            if (bounds) {
              mapInstance.fitBounds(bounds);
            }
          }
        });
      }
    }).addTo(mapInstance);
    
    arrondData[arrondNumber].layer = layer as unknown as any;
  }
  
  const allLayers = Object.values(arrondData)
    .map(a => a.layer)
    .filter(layer => layer !== null);
    
  if (allLayers.length > 0) {
    const group = L.featureGroup(allLayers);
    mapInstance.fitBounds(group.getBounds());
  }
} 