'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Minus, Thermometer, Droplets, Wind, CloudRain, Activity, Flame } from 'lucide-react';
import type { Map as LeafletMap, GeoJSON, Path, GeoJSON as LeafletGeoJSON } from 'leaflet';
import L from 'leaflet';
import { startDataSimulation } from './data';

type DisasterType = 'none' | 'seisme' | 'inondation' | 'both';
type Disaster = "earthquake" | "flood" | "none";

interface ZoneData {
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

interface District {
  id: number;
  name: string;
  disaster: DisasterType;
  zone: number;
}

interface ArrondissementData {
  feature: GeoJSON.Feature;
  layer: Path | null;
}

interface GeoJSONData {
  features: Array<{
    type: string;
    properties: {
      nom: string;
    };
    geometry: GeoJSON.Geometry;
  }>;
}

const CONFIG = {
  mapCenter: [45.75, 4.85] as [number, number], 
  mapZoom: 12,
  apiUrl: "https://data.grandlyon.com/geoserver/metropole-de-lyon/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=metropole-de-lyon:adr_voie_lieu.adrarrond&outputFormat=application/json&SRSNAME=EPSG:4326"
};

const DISASTER_TYPES: Record<string, DisasterType> = {
  NONE: 'none',
  SEISME: 'seisme',
  INONDATION: 'inondation',
  BOTH: 'both'
};

const ZONE_CONFIG = {
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

// Composant principal
export default function Home() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [arrondissements, setArrondissements] = useState<Record<number, ArrondissementData>>({});
  const [zoneData, setZoneData] = useState<Record<string, ZoneData>>({});
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Fonction pour initialiser la carte
    const initializeMap = async () => {
      try {
        if (typeof window !== 'undefined' && !map) {
          // S'assurer que le conteneur de carte existe
          const mapContainer = document.getElementById('map');
          if (!mapContainer) return;
          
          // Options de la carte
          const mapOptions = {
            center: CONFIG.mapCenter,
            zoom: CONFIG.mapZoom,
            zoomControl: false,
            attributionControl: false,
            preferCanvas: true
          };
          
          // Créer l'instance de carte
          const mapInstance = L.map('map', mapOptions);
          
          // Ajouter un fond de carte sombre
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }).addTo(mapInstance);
          
          mapInstance.scrollWheelZoom.disable();
          
          setMap(mapInstance);
          setMapReady(true);
          
          await fetchGeoData(mapInstance, L);
        }
      } catch (err) {
        console.error("Erreur lors de l'initialisation de la carte:", err);
        setError("Impossible d'initialiser la carte. Veuillez rafraîchir la page.");
      }
    };
    
    initializeMap();
    
    // Nettoyage lors du démontage du composant
    return () => {
      if (map) map.remove();
    };
  }, []);

  // Fonction pour récupérer les données GeoJSON
  const fetchGeoData = async (mapInstance: LeafletMap, L: typeof import('leaflet')) => {
    try {
      setLoading(true);
      
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
            
            // Déterminer la zone et le type de catastrophe
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
      
      setArrondissements(arrondData);
      setDistricts(districtsList);
      
      createGeoLayers(mapInstance, arrondData, districtsList, L);
      
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue s&apos;est produite");
      setLoading(false);
    }
  };

  // Créer les couches GeoJSON pour la carte
  const createGeoLayers = (
    mapInstance: LeafletMap,
    arrondData: Record<number, ArrondissementData>,
    districts: District[],
    L: typeof import('leaflet')
  ) => {
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
            mouseover: (e: { target: LeafletGeoJSON }) => {
              const layer = e.target;
              layer.setStyle({
                weight: 5,
                opacity: 0.8
              });
            },
          
            click: (e: { target: LeafletGeoJSON }) => {
              const bounds = (e.target as any).getBounds();
              if (bounds) {
                mapInstance.fitBounds(bounds);
              }
            }
          });
        }
      }).addTo(mapInstance);
      
      arrondData[arrondNumber].layer = layer as Path;
    }
    
    const allLayers = Object.values(arrondData)
      .map(a => a.layer)
      .filter((layer): layer is Path => layer !== null);
      
    if (allLayers.length > 0) {
      const group = L.featureGroup(allLayers);
      mapInstance.fitBounds(group.getBounds());
    }
  };

  // Mettre à jour les styles des couches GeoJSON quand les districts changent
  useEffect(() => {
    if (!mapReady || !map || Object.keys(arrondissements).length === 0) return;
    
    districts.forEach(district => {
      const arrondData = arrondissements[district.id];
      if (arrondData && arrondData.layer) {
        arrondData.layer.setStyle(getLeafletStyle(district.disaster, district.zone));
      }
    });
  }, [districts, arrondissements, mapReady, map]);

  // Obtenir le style Leaflet en fonction du type de catastrophe
  const getLeafletStyle = (disasterType: DisasterType, zoneId: number) => {
    const baseStyle = {
      weight: 2,
      opacity: 0.7,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    };
    
    // Si pas de catastrophe, zone grise
    if (disasterType === DISASTER_TYPES.NONE) {
      return { ...baseStyle, fillColor: '#374151', color: '#6b7280' };
    }
    
    // Couleurs par zone uniquement quand il y a une catastrophe
    switch (zoneId) {
      case 2:
        return { ...baseStyle, fillColor: '#f97316', color: '#f97316' }; // Orange pour Zone 2
      case 3:
        return { ...baseStyle, fillColor: '#22c55e', color: '#22c55e' }; // Vert pour Zone 3
      case 4:
        return { ...baseStyle, fillColor: '#3b82f6', color: '#3b82f6' }; // Bleu pour Zone 4
      default:
        return { ...baseStyle, fillColor: '#374151', color: '#6b7280' };
    }
  };

  // Obtenir la classe de couleur Tailwind en fonction du type de catastrophe
  const getDisasterColor = (disasterType: DisasterType) => {
    switch (disasterType) {
      case DISASTER_TYPES.SEISME:
        return 'bg-orange-500';
      case DISASTER_TYPES.INONDATION:
        return 'bg-blue-500';
      case DISASTER_TYPES.BOTH:
        return 'bg-green-500';
      default:
        return 'bg-gray-700';
    }
  };

  // Obtenir le texte en fonction du type de catastrophe
  const getDisasterText = (disasterType: DisasterType) => {
    switch (disasterType) {
      case DISASTER_TYPES.SEISME:
        return 'Séisme';
      case DISASTER_TYPES.INONDATION:
        return 'Inondation';
      case DISASTER_TYPES.BOTH:
        return 'Séisme & Inondation';
      default:
        return 'Aucun incident';
    }
  };

  // Fonction pour convertir les données de catastrophe
  const convertDisasterType = (disaster: Disaster | Disaster[]): DisasterType => {
    if (disaster === "none") return DISASTER_TYPES.NONE;
    
    if (Array.isArray(disaster)) {
      // Si c'est un tableau, on vérifie si les deux types sont présents
      const hasEarthquake = disaster.includes("earthquake");
      const hasFlood = disaster.includes("flood");
      
      if (hasEarthquake && hasFlood) {
        return DISASTER_TYPES.BOTH;
      } else if (hasEarthquake) {
        return DISASTER_TYPES.SEISME;
      } else if (hasFlood) {
        return DISASTER_TYPES.INONDATION;
      }
    } else {
      // Si c'est une seule catastrophe
      if (disaster === "earthquake") return DISASTER_TYPES.SEISME;
      if (disaster === "flood") return DISASTER_TYPES.INONDATION;
    }
    
    return DISASTER_TYPES.NONE;
  };

  // Fonction pour mettre à jour les districts en fonction des données de zone
  const updateDistrictsFromZoneData = (data: ZoneData) => {
    setDistricts(currentDistricts => {
      return currentDistricts.map(district => {
        const zone = Object.entries(ZONE_CONFIG).find(([, config]) => 
          config.arrondissements.includes(district.id)
        )?.[0];
        
        if (zone && data.district === `Zone ${zone}`) {
          const disasterType = convertDisasterType(data.disaster);
          console.log(`Zone ${zone} - Disaster: ${data.disaster} -> ${disasterType}`); // Debug
          return { ...district, disaster: disasterType };
        }
        return district;
      });
    });
  };

  // Démarrer la simulation de données
  useEffect(() => {
    const intervalId = startDataSimulation((newData: Record<string, ZoneData>) => {
      setZoneData(newData);
      
      // Mettre à jour les districts en fonction des nouvelles données
      Object.values(newData).forEach((data: ZoneData) => {
        updateDistrictsFromZoneData(data);
      });
    }, 1000); // Mise à jour toutes les 5 secondes

    // Nettoyage lors du démontage du composant
    return () => clearInterval(intervalId);
  }, []);

  // Affichage d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="p-6 bg-red-900/30 rounded-lg max-w-md">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-bold">Erreur</h2>
          </div>
          <p className="text-red-100">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md"
            onClick={() => window.location.reload()}
          >
            Rafraîchir la page
          </button>
        </div>
      </div>
    );
  }

  // Calculer les statistiques
  const affectedCount = districts.filter(d => d.disaster !== DISASTER_TYPES.NONE).length;
  const seismeCount = districts.filter(d => d.disaster === DISASTER_TYPES.SEISME || d.disaster === DISASTER_TYPES.BOTH).length;
  const inondationCount = districts.filter(d => d.disaster === DISASTER_TYPES.INONDATION || d.disaster === DISASTER_TYPES.BOTH).length;

  // Rendu principal
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Statistiques en haut */}
      <div className="flex justify-between items-center px-12 pt-8 pb-4">
        <div className="flex gap-12">
          <div>
            <div className="text-xs text-gray-400">Arrondissements affectés</div>
            <div className="text-2xl font-bold">{affectedCount}/{districts.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Séismes actifs</div>
            <div className="text-2xl font-bold text-orange-500">{seismeCount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Inondations actives</div>
            <div className="text-2xl font-bold text-blue-500">{inondationCount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Dernière mis à jour</div>
            <div className="text-xl font-bold">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Contenu principal : carte + panneau latéral */}
      <div className="flex flex-1 w-full px-12 pb-8 gap-8">
        {/* Carte centrée */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-lg p-0 overflow-hidden" style={{width: 700, height: 500}}>
            <div className="relative w-full h-full">
              <div 
                id="map" 
                className="h-full w-full rounded-2xl"
                style={{ background: '#111' }}
              ></div>
              {/* Boutons de zoom */}
              <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button
                  onClick={() => map?.zoomIn()}
                  className="w-6 h-6 bg-white hover:bg-gray-100 rounded-md flex items-center justify-center text-gray-800 shadow-lg border border-gray-200"
                  title="Zoomer"
                >
                  <Plus size={20} />
                </button>
                <button
                  onClick={() => map?.zoomOut()}
                  className="w-6 h-6 bg-white hover:bg-gray-100 rounded-md flex items-center justify-center text-gray-800 shadow-lg border border-gray-200"
                  title="Dézoomer"
                >
                  <Minus size={20} />
                </button>
                <button
                  onClick={() => {
                    if (map) {
                      const allLayers = Object.values(arrondissements)
                        .map(a => a.layer)
                        .filter((layer): layer is Path => layer !== null);
                      if (allLayers.length > 0) {
                        const group = L.featureGroup(allLayers);
                        map.fitBounds(group.getBounds());
                      }
                    }
                  }}
                  className="w-6 h-6 bg-white hover:bg-gray-100 rounded-md flex items-center justify-center text-gray-800 shadow-lg border border-gray-200"
                  title="Vue d'ensemble"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Panneau latéral */}
        <div className="w-64 flex flex-col gap-4">
          {Object.entries(ZONE_CONFIG).map(([zoneId, config]) => {
            const firstDistrictInZone = districts.find(d => config.arrondissements.includes(d.id));
            const currentDisaster = firstDistrictInZone?.disaster || DISASTER_TYPES.NONE;
            const currentZoneData = Object.values(zoneData).find(d => d.district === `Zone ${zoneId}`);
            return (
              <div key={zoneId} className="bg-gray-900 rounded-lg p-4 flex flex-col gap-1 border border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${getDisasterColor(currentDisaster)}`}></div>
                  <span className="font-bold text-lg">Zone {zoneId}</span>
                </div>
                <div className="text-xs text-gray-400 mb-1">Arrondissements : {config.arrondissements.join(', ')}</div>
                <div className="text-sm mb-1">{getDisasterText(currentDisaster)}</div>
                {currentZoneData && (
                  <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1"><Thermometer size={14} className="text-orange-500" /><span>{currentZoneData.temperature}°C</span></div>
                    <div className="flex items-center gap-1"><Droplets size={14} className="text-blue-500" /><span>{currentZoneData.humidity}%</span></div>
                    <div className="flex items-center gap-1"><Wind size={14} className="text-gray-400" /><span>{currentZoneData.average_wind_speed} m/s</span></div>
                    <div className="flex items-center gap-1"><CloudRain size={14} className="text-blue-400" /><span>{currentZoneData.total_rain} mm</span></div>
                    <div className="flex items-center gap-1"><Activity size={14} className="text-red-500" /><span>{(currentZoneData.seismicity * 100).toFixed(1)}%</span></div>
                    <div className="flex items-center gap-1"><Flame size={14} className="text-yellow-500" /><span>{currentZoneData.gas_concentration} ppm</span></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat en bas à droite
      <div className="fixed bottom-8 right-8 w-96 bg-gray-800 rounded-xl p-4 text-white shadow-lg border border-gray-700">
        <div className="mb-2">
          <span className="font-bold">John :</span> vous avez vu !!
        </div>
        <div>
          <span className="font-bold">Doe :</span> OMG ma maison est parti en mille morceaux
        </div>
      </div> */}

      {/* Onglet zone sélectionnée en bas à gauche */}
      {/* <div className="fixed bottom-8 left-8 bg-gray-700 rounded-t-xl px-6 py-3 text-white shadow-lg">
        Zone 2
      </div> */}
    </div>
  );
}