// Seuils pour déclencher les catastrophes
const THRESHOLDS = {
  earthquake: {
    seismicity: 0.4, // Augmenté le seuil de sismicité
    gas_concentration: 90 // Augmenté le seuil de concentration de gaz
  },
  flood: {
    total_rain: 45, // Augmenté le seuil de pluie totale
    max_rain_intensity: 15, // Augmenté le seuil d'intensité maximale de pluie
    humidity: 60 // Augmenté le seuil d'humidité
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
    total_rain: 35,
    seismicity: 0.6, 
    gas_concentration: 100
  },
  "Zone 3": {
    temperature: 23,
    humidity: 75,
    average_wind_speed: 6,
    max_wind_speed: 9,
    max_rain_intensity: 13, 
    total_rain: 50,
    seismicity: 0.6, 
    gas_concentration: 120
  },
  "Zone 4": {
    temperature: 21,
    humidity: 70,
    average_wind_speed: 4,
    max_wind_speed: 7,
    max_rain_intensity: 20,
    total_rain: 60,
    seismicity: 0.5,
    gas_concentration: 100
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
  
  // Zone 2 : séisme seulement si les seuils sont dépassés
  if (zone === "Zone 2") {
    if (data.seismicity >= THRESHOLDS.earthquake.seismicity && 
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
  
  // Zone 3 : séisme et inondation seulement si les seuils sont dépassés
  if (zone === "Zone 3") {
    const disasters = [];
    
    if (data.seismicity >= THRESHOLDS.earthquake.seismicity || 
        data.gas_concentration >= THRESHOLDS.earthquake.gas_concentration) {
      disasters.push("earthquake");
    }
    
    if (data.total_rain >= THRESHOLDS.flood.total_rain ||
        data.max_rain_intensity >= THRESHOLDS.flood.max_rain_intensity ||
        data.humidity >= THRESHOLDS.flood.humidity) {
      disasters.push("flood");
    }
    
    return disasters.length > 0 ? disasters : "none";
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
      temperature: roundToTenth(randomVariation(baseData.temperature, 8)),
      humidity: roundToTenth(randomVariation(baseData.humidity, 25)),
      average_wind_speed: roundToTenth(randomVariation(baseData.average_wind_speed, 5)),
      max_wind_speed: roundToTenth(randomVariation(baseData.max_wind_speed, 8)),
      max_rain_intensity: roundToTenth(randomVariation(baseData.max_rain_intensity, 15)),
      total_rain: roundToTenth(randomVariation(baseData.total_rain, 30)),
      seismicity: roundToTenth(randomVariation(baseData.seismicity, 0.8)),
      gas_concentration: roundToTenth(randomVariation(baseData.gas_concentration, 60))
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