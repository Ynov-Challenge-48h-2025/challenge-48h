// Seuils pour déclencher les catastrophes
const THRESHOLDS = {
  earthquake: {
    seismicity: 0.6, // Seuil de sismicité pour déclencher un séisme
    gas_concentration: 120 // Seuil de concentration de gaz pour aggraver le risque
  },
  flood: {
    total_rain: 40, // Seuil de pluie totale en mm
    max_rain_intensity: 12, // Seuil d'intensité maximale de pluie en mm/h
    humidity: 75 // Seuil d'humidité en %
  }
};

// Données de base pour chaque zone
const BASE_DATA = {
  "Zone 2": {
    temperature: 22,
    humidity: 60,
    average_wind_speed: 5,
    max_wind_speed: 8,
    max_rain_intensity: 8,
    total_rain: 20,
    seismicity: 0.5,
    gas_concentration: 90
  },
  "Zone 3": {
    temperature: 23,
    humidity: 80, // Augmenté pour garantir l'inondation
    average_wind_speed: 6,
    max_wind_speed: 9,
    max_rain_intensity: 15, // Augmenté pour garantir l'inondation
    total_rain: 45, // Augmenté pour garantir l'inondation
    seismicity: 0.7, // Augmenté pour garantir le séisme
    gas_concentration: 130 // Augmenté pour garantir le séisme
  },
  "Zone 4": {
    temperature: 21,
    humidity: 70,
    average_wind_speed: 4,
    max_wind_speed: 7,
    max_rain_intensity: 10,
    total_rain: 35,
    seismicity: 0.3,
    gas_concentration: 90
  }
};

// Fonction pour arrondir au dixième
const roundToTenth = (value) => {
  return Math.round(value * 10) / 10;
};

// Fonction pour générer une variation aléatoire
const randomVariation = (base, maxVariation) => {
  const variation = (Math.random() - 0.5) * maxVariation;
  return roundToTenth(base + variation);
};

// Fonction pour déterminer les catastrophes en fonction des données
const determineDisasters = (data) => {
  const zone = data.district;
  
  // Zone 2 : uniquement séisme
  if (zone === "Zone 2") {
    if (data.seismicity >= THRESHOLDS.earthquake.seismicity || 
        data.gas_concentration >= THRESHOLDS.earthquake.gas_concentration) {
      return "earthquake";
    }
    return "none";
  }
  
  // Zone 4 : uniquement inondation
  if (zone === "Zone 4") {
    if (data.total_rain >= THRESHOLDS.flood.total_rain ||
        data.max_rain_intensity >= THRESHOLDS.flood.max_rain_intensity ||
        data.humidity >= THRESHOLDS.flood.humidity) {
      return "flood";
    }
    return "none";
  }
  
  // Zone 3 : toujours les deux catastrophes
  if (zone === "Zone 3") {
    return ["earthquake", "flood"];
  }
  
  return "none";
};

// Fonction pour générer de nouvelles données
export const generateNewData = () => {
  const newData = {};
  const date = new Date().toISOString();

  Object.entries(BASE_DATA).forEach(([zone, baseData]) => {
    const updatedData = {
      date,
      district: zone,
      temperature: roundToTenth(randomVariation(baseData.temperature, 5)),
      humidity: roundToTenth(randomVariation(baseData.humidity, 15)),
      average_wind_speed: roundToTenth(randomVariation(baseData.average_wind_speed, 3)),
      max_wind_speed: roundToTenth(randomVariation(baseData.max_wind_speed, 5)),
      max_rain_intensity: roundToTenth(randomVariation(baseData.max_rain_intensity, 8)),
      total_rain: roundToTenth(randomVariation(baseData.total_rain, 20)),
      seismicity: roundToTenth(randomVariation(baseData.seismicity, 0.6)), // Augmenté la variation de 0.4 à 0.6
      gas_concentration: roundToTenth(randomVariation(baseData.gas_concentration, 40))
    };

    // Déterminer les catastrophes en fonction des nouvelles données
    updatedData.disaster = determineDisasters(updatedData);

    newData[zone] = updatedData;
  });

  return newData;
};

// Fonction pour simuler des données en temps réel
export const startDataSimulation = (callback, interval = 5000) => {
  // Générer les données initiales
  let currentData = generateNewData();
  callback(currentData);

  // Mettre à jour les données à intervalles réguliers
  return setInterval(() => {
    currentData = generateNewData();
    callback(currentData);
  }, interval);
};

// Exporter les seuils pour référence
export const DISASTER_THRESHOLDS = THRESHOLDS; 