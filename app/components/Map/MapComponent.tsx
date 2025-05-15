"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Plus, Minus } from "lucide-react";
import { ArrondissementData } from "@/app/types";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
    onMapReady: (map: LeafletMap) => void;
    map: LeafletMap | null;
    arrondissements: Record<number, ArrondissementData>;
}

const CONFIG = {
    mapCenter: [45.75, 4.85] as [number, number],
    mapZoom: 12,
};

export default function MapComponent({
    onMapReady,
    map,
    arrondissements,
}: MapComponentProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapContainerRef.current || map) return;

        const initializeMap = async () => {
            try {
                const L = (await import("leaflet")).default;

                // Options de la carte
                const mapOptions = {
                    center: CONFIG.mapCenter,
                    zoom: CONFIG.mapZoom,
                    zoomControl: false,
                    attributionControl: false,
                    preferCanvas: true,
                };

                if (document.getElementById("map")?._leaflet_id != null) return;
                const mapInstance = L.map("map", mapOptions);

                L.tileLayer(
                    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                    {
                        maxZoom: 19,
                        attribution:
                            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    }
                ).addTo(mapInstance);

                mapInstance.scrollWheelZoom.disable();

                onMapReady(mapInstance);
            } catch (err) {
                console.error(
                    "Erreur lors de l'initialisation de la carte:",
                    err
                );
            }
        };

        initializeMap();
    }, [map, onMapReady]);

    const resetMapView = () => {
        if (!map || !arrondissements) return;

        // On doit importer Leaflet dynamiquement ici aussi pour accéder à L
        import("leaflet")
            .then((L) => {
                const allLayers = Object.values(arrondissements)
                    .map((a) => a.layer)
                    .filter((layer) => layer !== null);

                if (allLayers.length > 0) {
                    const group = L.featureGroup(allLayers);
                    map.fitBounds(group.getBounds());
                }
            })
            .catch((err) => {
                console.error("Erreur lors du chargement de Leaflet:", err);
            });
    };

    return (
        <div className="relative w-full h-full">
            <div
                id="map"
                ref={mapContainerRef}
                className="h-full w-full rounded-2xl"
                style={{ background: "#111" }}
            ></div>

            {/* Boutons de contrôle */}
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
                    onClick={resetMapView}
                    className="w-6 h-6 bg-white hover:bg-gray-100 rounded-md flex items-center justify-center text-gray-800 shadow-lg border border-gray-200"
                    title="Vue d'ensemble"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                        />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
