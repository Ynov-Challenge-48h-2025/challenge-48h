"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import { ArrondissementData, District, ZoneData } from "./types";
import SidePanel from "./components/SidePanel/SidePanel";
import StatsHeader from "./components/Header/StatsHeader";
import { fetchGeoData } from "./services/geoService";
import { getLeafletStyle } from "./components/Map/mapUtils";
import dynamic from "next/dynamic";
import { Gallery4 } from "./components/Galery/Galery";
import { demoData, seisme_activities } from "./galery-data";
import { HeroSection } from "./components/Hero/Galaxy";
import ChatWidget from "@/app/components/ChatWidget";
import { updateDistrictsFromZoneData } from "@/app/services/dataService";

const MapComponent = dynamic(() => import("./components/Map/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-2xl flex items-center justify-center bg-gray-900">
      <div className="text-white">Chargement de la carte...</div>
    </div>
  ),
});

export default function Home() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [arrondissements, setArrondissements] = useState<
    Record<number, ArrondissementData>
  >({});
  const [zoneData, setZoneData] = useState<Record<string, ZoneData>>({});
  const [mapReady, setMapReady] = useState(false);
  const [districtsInitialized, setDistrictsInitialized] = useState(false);

  useEffect(() => {
    const initData = async () => {
      if (!map) return;

      try {
        const { arrondissements: arrondData, districts: districtsData } =
          await fetchGeoData(map);
        setDistrictsInitialized(true);
        setArrondissements(arrondData);
        setDistricts(districtsData);
        setMapReady(true);
      } catch (err) {
        console.error("Erreur lors de l'initialisation des données:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur inconnue s'est produite",
        );
      }
    };

    if (map) {
      initData();
    }
  }, [map]);

  useEffect(() => {
    if (!mapReady || !map || Object.keys(arrondissements).length === 0) return;

    districts.forEach((district) => {
      const arrondData = arrondissements[district.id];
      if (arrondData && arrondData.layer) {
        arrondData.layer.setStyle(
          getLeafletStyle(district.disaster, district.zone),
        );
      }
    });
  }, [districts, arrondissements, mapReady, map]);

  useEffect(() => {
    fetch(`${process.env.API_URL}/api/data`)
      .then((res) => res.json())
      .then((res: { lastEntry: ZoneData; _id: string }[]) => {
        const newData = res.reduce(
          (acc, { lastEntry }) => {
            acc[lastEntry.district] = lastEntry;
            return acc;
          },
          {} as Record<string, ZoneData>,
        );

        setZoneData(newData);

        Object.values(newData).forEach((data: ZoneData) => {
          setDistricts((currentDistricts) => {
            return updateDistrictsFromZoneData(data, currentDistricts);
          });
        });
      });
  }, [districtsInitialized]);

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

  return (
    <>
      <section className="bg-black relative h-screen w-screen">
        <HeroSection />
      </section>
      <section className="min-h-screen bg-black text-white flex flex-col">
        <StatsHeader districts={districts} />

        <div className="flex flex-1 w-full px-12 pb-8 gap-8">
          <div className="flex-1 flex items-center justify-center">
            <div
              className="bg-gray-900 rounded-2xl border border-gray-700 shadow-lg p-0 overflow-hidden"
              style={{ width: 700, height: 500 }}
            >
              <MapComponent
                onMapReady={setMap}
                map={map}
                arrondissements={arrondissements}
              />
            </div>
          </div>

          <SidePanel districts={districts} zoneData={zoneData} />
        </div>
      </section>
      <section className=" bg-black text-white flex flex-col">
        <Gallery4
          title={demoData.title}
          description={demoData.description}
          items={demoData.items}
        />
      </section>
      <section className=" bg-black text-white flex flex-col">
        <Gallery4
          title={seisme_activities.title}
          description={seisme_activities.description}
          items={seisme_activities.items}
        />
      </section>
      <ChatWidget />
    </>
  );
}
