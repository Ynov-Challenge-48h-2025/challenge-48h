'use client';

import { useState, useEffect } from 'react';
import { MapPin, Waves, Dices, AlertTriangle } from 'lucide-react';
import type { Map as LeafletMap, GeoJSON, Path, GeoJSON as LeafletGeoJSON } from 'leaflet';

type DisasterType = 'none' | 'seisme' | 'inondation' | 'both';

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
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Fonction pour initialiser la carte
    const initializeMap = async () => {
      try {
        const L = await import('leaflet');
        
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
      
      const style = getLeafletStyle(district?.disaster || DISASTER_TYPES.NONE);
      
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
            mouseout: (e: { target: LeafletGeoJSON }) => {
              const layer = e.target;
              const district = districts.find(d => d.id === parseInt(arrondNumber, 10));
              const style = getLeafletStyle(district?.disaster || DISASTER_TYPES.NONE);
              layer.setStyle(style);
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
        arrondData.layer.setStyle(getLeafletStyle(district.disaster));
      }
    });
  }, [districts, arrondissements, mapReady, map]);

  // Obtenir le style Leaflet en fonction du type de catastrophe
  const getLeafletStyle = (disasterType: DisasterType) => {
    const baseStyle = {
      weight: 2,
      opacity: 0.7,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    };
    
    switch (disasterType) {
      case DISASTER_TYPES.SEISME:
        return { ...baseStyle, fillColor: '#f97316', color: '#f97316' };
      case DISASTER_TYPES.INONDATION:
        return { ...baseStyle, fillColor: '#3b82f6', color: '#3b82f6' };
      case DISASTER_TYPES.BOTH:
        return { ...baseStyle, fillColor: '#22c55e', color: '#22c55e' };
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

  // Handlers pour les boutons
  const handleSetSeisme = () => {
    setDistricts(currentDistricts => {
      return currentDistricts.map(district => {
        const zone = Object.entries(ZONE_CONFIG).find(([, config]) => 
          config.arrondissements.includes(district.id)
        )?.[0];
        
        if (zone === '2') {
          return { ...district, disaster: DISASTER_TYPES.SEISME };
        }
        return district;
      });
    });
  };

  const handleSetInondation = () => {
    setDistricts(currentDistricts => {
      return currentDistricts.map(district => {
        const zone = Object.entries(ZONE_CONFIG).find(([, config]) => 
          config.arrondissements.includes(district.id)
        )?.[0];
        
        if (zone === '4') {
          return { ...district, disaster: DISASTER_TYPES.INONDATION };
        }
        return district;
      });
    });
  };

  const handleSetBoth = () => {
    setDistricts(currentDistricts => {
      return currentDistricts.map(district => {
        const zone = Object.entries(ZONE_CONFIG).find(([, config]) => 
          config.arrondissements.includes(district.id)
        )?.[0];
        
        if (zone === '3') {
          return { ...district, disaster: DISASTER_TYPES.BOTH };
        }
        return district;
      });
    });
  };

  const handleReset = () => {
    setDistricts(currentDistricts => {
      return currentDistricts.map(district => {
        return { ...district, disaster: DISASTER_TYPES.NONE };
      });
    });
  };

  const handleRandom = () => {
    setDistricts(currentDistricts => {
      return currentDistricts.map(district => {
        const zone = Object.entries(ZONE_CONFIG).find(([, config]) => 
          config.arrondissements.includes(district.id)
        )?.[0];
        
        if (zone) {
          const randomValue = Math.random();
          const zoneNumber = parseInt(zone);
          
          if (randomValue < 0.3) {
            return { ...district, disaster: DISASTER_TYPES.NONE };
          } else if (zoneNumber === 2) {
            return { ...district, disaster: DISASTER_TYPES.SEISME };
          } else if (zoneNumber === 3) {
            return { ...district, disaster: DISASTER_TYPES.BOTH };
          } else if (zoneNumber === 4) {
            return { ...district, disaster: DISASTER_TYPES.INONDATION };
          }
        }
        return district;
      });
    });
  };

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
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Monitoring des Catastrophes Naturelles à Lyon</h1>
      
      {/* Légende */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Légende</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>Séisme</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Inondation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Séisme & Inondation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 rounded"></div>
            <span>Aucun incident</span>
          </div>
        </div>
      </div>
      
      {/* Dashboard principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Carte des arrondissements */}
        <div className="col-span-2 bg-gray-900 rounded-lg p-4 h-96">
          <h2 className="text-lg font-semibold mb-2">Carte des Arrondissements</h2>
          <div className="border border-gray-700 rounded-lg h-80 relative">
            <div 
              id="map" 
              className="h-full w-full rounded-lg"
              style={{ background: '#111' }}
            ></div>
          </div>
        </div>
        
        {/* Panneau latéral d'informations */}
        <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Statut des Zones</h2>
          <div className="space-y-4">
            {Object.entries(ZONE_CONFIG).map(([zoneId, config]) => {
              // Trouver le premier district de la zone pour obtenir son état actuel
              const firstDistrictInZone = districts.find(d => config.arrondissements.includes(d.id));
              const currentDisaster = firstDistrictInZone?.disaster || DISASTER_TYPES.NONE;

              return (
                <div key={zoneId} className="p-3 bg-gray-800 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${getDisasterColor(currentDisaster)}`}></div>
                    <span className="font-semibold">{config.name}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Arrondissements : {config.arrondissements.join(', ')}
                  </div>
                  <div className="text-sm mt-1">
                    {getDisasterText(currentDisaster)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Simulateur de catastrophes */}
      <div className="mt-6 p-4 bg-gray-900 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Simulateur d&apos;événements</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-md flex items-center gap-1" 
            onClick={handleSetSeisme}
          >
            <MapPin size={16} /> Séisme (Zone 2)
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md flex items-center gap-1"
            onClick={handleSetInondation}
          >
            <Waves size={16} /> Inondation (Zone 4)
          </button>
          <button 
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md flex items-center gap-1"
            onClick={handleSetBoth}
          >
            <MapPin size={16} /> <Waves size={16} /> Les deux (Zone 3)
          </button>
          <button 
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md flex items-center gap-1"
            onClick={handleReset}
          >
            Réinitialiser
          </button>
          <button 
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md flex items-center gap-1"
            onClick={handleRandom}
          >
            <Dices size={16} /> Aléatoire
          </button>
        </div>
      </div>
      
      {/* Statistiques */}
      <div className="mt-6 p-4 bg-gray-900 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Statistiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Arrondissements affectés</div>
            <div className="text-2xl font-bold">
              {affectedCount}/{districts.length}
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Séismes actifs</div>
            <div className="text-2xl font-bold text-orange-500">
              {seismeCount}
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Inondations actives</div>
            <div className="text-2xl font-bold text-blue-500">
              {inondationCount}
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Dernière mise à jour</div>
            <div className="text-xl font-bold">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}