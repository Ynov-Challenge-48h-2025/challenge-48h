'use client';

import { Thermometer, Droplets, Wind, CloudRain, Activity, Flame } from 'lucide-react';
import { District, ZoneData } from '@/app/types';
import { getDisasterColor, getDisasterText } from '../Map/mapUtils';

interface ZoneCardProps {
  zoneId: string;
  zoneConfig: {
    name: string;
    arrondissements: number[];
  };
  districts: District[];
  zoneData: ZoneData | undefined;
}

export default function ZoneCard({ zoneId, zoneConfig, districts, zoneData }: ZoneCardProps) {
  const firstDistrictInZone = districts.find(d => zoneConfig.arrondissements.includes(d.id));
  const currentDisaster = firstDistrictInZone?.disaster || 'none';

  return (
    <div className="bg-gray-900 rounded-lg p-4 flex flex-col gap-1 border border-gray-700">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-3 h-3 rounded-full ${getDisasterColor(currentDisaster)}`}></div>
        <span className="font-bold text-lg">Zone {zoneId}</span>
      </div>
      <div className="text-xs text-gray-400 mb-1">Arrondissements : {zoneConfig.arrondissements.join(', ')}</div>
      <div className="text-sm mb-1">{getDisasterText(currentDisaster)}</div>
      {zoneData && (
        <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Thermometer size={14} className="text-orange-500" />
            <span>{zoneData.temperature}°C</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets size={14} className="text-blue-500" />
            <span>{zoneData.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind size={14} className="text-gray-400" />
            <span>{zoneData.average_wind_speed} m/s</span>
          </div>
          <div className="flex items-center gap-1">
            <CloudRain size={14} className="text-blue-400" />
            <span>{zoneData.total_rain} mm</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity size={14} className="text-red-500" />
            <span>{(zoneData.seismicity * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame size={14} className="text-yellow-500" />
            <span>{zoneData.gas_concentration} ppm</span>
          </div>
        </div>
      )}
    </div>
  );
} 