import {
  District,
  Disaster,
  DisasterType,
  ZoneData,
  DISASTER_TYPES,
} from "@/app/types";

export const convertDisasterType = (
  disaster: Disaster | Disaster[],
): DisasterType => {
  console.log(disaster);

  if (disaster === "none") return DISASTER_TYPES.NONE;

  if (Array.isArray(disaster)) {
    const hasEarthquake = disaster.includes("earthquake");
    const hasFlood = disaster.includes("flood");

    if (hasEarthquake) {
      return DISASTER_TYPES.SEISME;
    } else if (hasFlood) {
      return DISASTER_TYPES.INONDATION;
    }
  } else {
    if (disaster === "earthquake") return DISASTER_TYPES.SEISME;
    if (disaster === "flood") return DISASTER_TYPES.INONDATION;
  }

  return DISASTER_TYPES.NONE;
};

export const updateDistrictsFromZoneData = (
  data: ZoneData,
  currentDistricts: District[],
): District[] => {
  return currentDistricts.map((district) => {
    const zoneMatch = data.district.match(/Zone (\d+)/);
    console.log("zoneMatch", zoneMatch);
    if (!zoneMatch) return district;

    const zoneNumber = parseInt(zoneMatch[1], 10);

    if (district.zone === zoneNumber) {
      const disasterType = convertDisasterType(data.disaster);
      return { ...district, disaster: disasterType };
    }
    return district;
  });
};
