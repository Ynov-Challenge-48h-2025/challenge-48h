"use client";

import { District, DISASTER_TYPES } from "@/app/types";
import { useEffect, useState } from "react";

interface StatsHeaderProps {
  districts: District[];
}

export default function StatsHeader({ districts }: StatsHeaderProps) {
  // Calculer les statistiques
  const affectedCount = districts.filter(
    (d) => d.disaster !== DISASTER_TYPES.NONE,
  ).length;
  const seismeCount = districts.filter(
    (d) => d.disaster === DISASTER_TYPES.SEISME,
  ).length;
  const inondationCount = districts.filter(
    (d) => d.disaster === DISASTER_TYPES.INONDATION,
  ).length;
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    setDate(new Date());
  }, []);
  return (
    <div className="flex justify-between items-center px-12 pt-8 pb-4">
      <div className="flex gap-12">
        <div>
          <div className="text-xs text-gray-400">Arrondissements affectés</div>
          <div className="text-2xl font-bold">
            {affectedCount}/{districts.length}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Séismes actifs</div>
          <div className="text-2xl font-bold text-orange-500">
            {seismeCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Inondations actives</div>
          <div className="text-2xl font-bold text-blue-500">
            {inondationCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Dernière mis à jour</div>
          <div className="text-xl font-bold">{date?.toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
}
