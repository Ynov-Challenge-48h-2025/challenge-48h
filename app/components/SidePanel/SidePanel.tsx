'use client';

import { District, ZoneData, ZONE_CONFIG } from '@/app/types';
import ZoneCard from './ZoneCard';

interface SidePanelProps {
  districts: District[];
  zoneData: Record<string, ZoneData>;
}

export default function SidePanel({ districts, zoneData }: SidePanelProps) {
  return (
    <div className="w-64 flex flex-col gap-4">
      {Object.entries(ZONE_CONFIG).map(([zoneId, config]) => {
        const currentZoneData = Object.values(zoneData).find(d => d.district === `Zone ${zoneId}`);
        return (
          <ZoneCard 
            key={zoneId} 
            zoneId={zoneId} 
            zoneConfig={config} 
            districts={districts} 
            zoneData={currentZoneData} 
          />
        );
      })}
    </div>
  );
} 