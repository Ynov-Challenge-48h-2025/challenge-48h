"use client";

import React, { useEffect, useRef, useState } from "react";
import { lazy } from "react";
const Spline = lazy(() => import("@splinetool/react-spline"));

function HeroSplineBackground() {
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                pointerEvents: "auto",
                overflow: "hidden",
            }}
        >
            <Spline
                style={{
                    width: "100%",
                    height: "100vh",
                    pointerEvents: "auto",
                }}
                scene="https://prod.spline.design/us3ALejTXl6usHZ7/scene.splinecode"
            />
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100vh",
                    background: `
            linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.8)),
            linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.9))
          `,
                    pointerEvents: "none",
                }}
            />
        </div>
    );
}

function HeroContent() {
    return (
        <div className="text-left text-white pt-16 sm:pt-24 md:pt-32 px-4 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 leading-tight tracking-wide">
                Quand Lyon fait des siennes… on a de quoi s’occuper !
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-80 max-w-xl">
                On surveille les catastrophes naturelles en temps réel et on
                vous propose des idées pour rester actif, utile ou créatif
                pendant la crise. Infos fiables, activités insolites, entraide
                locale — parce que même sous la pluie, Lyon reste vivante !
            </p>
        </div>
    );
}

export const HeroSection = () => {
    // Add 'export' here
    const screenshotRef = useRef<HTMLDivElement>(null);
    const heroContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (screenshotRef.current && heroContentRef.current) {
                requestAnimationFrame(() => {
                    const scrollPosition = window.pageYOffset;
                    if (screenshotRef.current) {
                        screenshotRef.current.style.transform = `translateY(-${
                            scrollPosition * 0.5
                        }px)`;
                    }

                    const maxScroll = 400;
                    const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
                    if (heroContentRef.current) {
                        heroContentRef.current.style.opacity =
                            opacity.toString();
                    }
                });
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="relative">
            <div className="relative min-h-screen">
                <div className="absolute inset-0 z-0 pointer-events-auto">
                    <HeroSplineBackground />
                </div>

                <div
                    ref={heroContentRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100vh",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        zIndex: 10,
                        pointerEvents: "none",
                    }}
                >
                    <div className="container mx-auto">
                        <HeroContent />
                    </div>
                </div>
            </div>
        </div>
    );
};
