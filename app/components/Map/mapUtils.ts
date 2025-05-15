import { DISASTER_TYPES, DisasterType } from "@/app/types";

// Obtenir le style Leaflet en fonction du type de catastrophe
export const getLeafletStyle = (disasterType: DisasterType, zoneId: number) => {
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
export const getDisasterColor = (disasterType: DisasterType) => {
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
export const getDisasterText = (disasterType: DisasterType) => {
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