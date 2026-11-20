"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { DESTINATION_SLIDES, DestinationKey } from "@/types";

interface DestinationMorphDeckProps {
  onBookDestination: (destination: DestinationKey) => void;
}

const MORPH_EASE = [0.22, 1, 0.36, 1] as const;

export function DestinationMorphDeck({
  onBookDestination,
}: DestinationMorphDeckProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const resetView = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const stepSlide = useCallback((direction: 1 | -1) => {
    setActiveIndex((prev) => {
      if (prev === null) {
        return direction === 1 ? 0 : DESTINATION_SLIDES.length - 1;
      }
      return (
        (prev + direction + DESTINATION_SLIDES.length) %
        DESTINATION_SLIDES.length
      );
    });
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        stepSlide(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepSlide(-1);
      } else if (e.key === "Escape") {
        resetView();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stepSlide, resetView]);

  return (
    <section
      id="destinations"
      aria-label="Sri Lanka Luxury Destinations Interactive Deck"
      className="relative h-screen min-h-[680px] w-full overflow-hidden bg-[#0A0F0D]"
    >
      {/* Top Controls Bar when a slide is active */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: MORPH_EASE }}
            className="pointer-events-none absolute inset-x-0 top-24 z-30 flex items-center justify-between px-6 sm:px-10"
          >
            <button
              type="button"
              onClick={resetView}
              className="pointer-events-auto glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/95 transition hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Show All Places</span>
            </button>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous destination"
                onClick={() => stepSlide(-1)}
                className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next destination"
                onClick={() => stepSlide(1)}
                className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4-Column Morph Split-Panel Deck */}
      <div className="flex h-full w-full flex-col md:flex-row">
        {DESTINATION_SLIDES.map((slide, idx) => {
          const isActive = activeIndex === idx;
          const isAnyActive = activeIndex !== null;

          return (
            <motion.article
              key={slide.key}
              layout
              onClick={() => setActiveIndex(isActive ? null : idx)}
              transition={{
                layout: { duration: 0.72, ease: MORPH_EASE },
              }}
              style={{
                flexGrow: isActive ? 3.8 : isAnyActive ? 0.55 : 1,
                flexBasis: 0,
              }}
              className="group relative flex min-h-0 cursor-pointer flex-col justify-end overflow-hidden border-b border-white/10 md:border-b-0 md:border-r"
            >
              {/* Background Cover Image */}
              <motion.div
                layout="position"
                animate={{
                  scale: isActive ? 1.04 : 1.0,
                }}
                transition={{ duration: 0.9, ease: MORPH_EASE }}
                className="absolute inset-0"
              >
                <Image
                  src={slide.coverImage}
                  alt={slide.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
              </motion.div>

              {/* Atmospheric Tint & Dark Luxury Vignette */}
              <div
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                  background: isActive
                    ? `linear-gradient(110deg, rgba(10,15,13,0.90) 0%, rgba(10,15,13,0.52) 55%, ${slide.accentGlow} 100%)`
                    : `linear-gradient(180deg, rgba(10,15,13,0.18) 0%, rgba(10,15,13,0.55) 62%, rgba(10,15,13,0.92) 100%)`,
                }}
              />

              {/* Subtle Top Accent Hairline */}
              <div
                className="absolute inset-x-0 top-0 h-[2px] transition-all duration-500"
                style={{
                  backgroundColor: isActive
                    ? slide.accentColor
                    : "rgba(255,255,255,0.06)",
                }}
              />

              {/* Slide Content */}
              <div className="relative z-20 p-6 sm:p-8 lg:p-12">
                <motion.div layout="position" className="max-w-2xl">
                  <motion.h2
                    layout="position"
                    className={`font-serif font-semibold tracking-wide text-white transition-all duration-500 md:whitespace-nowrap ${
                      isActive
                        ? "text-5xl sm:text-6xl lg:text-7xl"
                        : isAnyActive
                        ? "text-2xl sm:text-3xl md:opacity-70"
                        : "text-3xl sm:text-4xl lg:text-5xl"
                    }`}
                  >
                    {slide.title}
                  </motion.h2>
                </motion.div>

                {/* Glassmorphic Expanded Drawer */}
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      key={`${slide.key}-drawer`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        y: 10,
                        transition: { duration: 0.14, ease: "easeOut" },
                      }}
                      transition={{
                        duration: 0.35,
                        delay: 0.18,
                        ease: MORPH_EASE,
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="glass-panel mt-6 w-[300px] max-w-[calc(100vw-3rem)] shrink-0 rounded-2xl p-6 shadow-2xl sm:w-[440px] lg:w-[540px]"
                    >
                      <p className="text-sm leading-relaxed text-white/85 sm:text-base">
                        {slide.description}
                      </p>

                      <div className="mt-5 grid gap-4 border-y border-white/10 py-4 text-sm sm:grid-cols-2">
                        <div>
                          <span className="block text-xs text-white/55">
                            Location
                          </span>
                          <span className="mt-0.5 block text-white/95">
                            {slide.region}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-white/55">
                            Best Time to Visit
                          </span>
                          <span className="mt-0.5 block text-white/95">
                            {slide.bestSeason}
                          </span>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2 text-sm text-white/85">
                        {slide.highlights.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <span className="mt-2.5 h-px w-3 shrink-0 bg-[#D4AF37]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-baseline gap-5">
                          <div>
                            <span className="block text-xs text-white/60">
                              Foreign Visitors From
                            </span>
                            <span className="font-serif text-2xl font-semibold text-[#D4AF37]">
                              ${slide.startingPriceUsd.toLocaleString()}
                            </span>
                            <span className="ml-1 text-xs text-white/60">
                              / person
                            </span>
                          </div>
                          <div className="border-l border-white/15 pl-5">
                            <span className="block text-xs text-white/60">
                              Sri Lankan Locals
                            </span>
                            <span className="font-serif text-xl font-semibold text-white">
                              LKR {slide.localStartingPriceLkr.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onBookDestination(slide.key)}
                          className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0A0F0D] shadow-lg shadow-[#D4AF37]/25 transition hover:bg-[#E7C660]"
                        >
                          <span>Book This Trip</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isActive && !isAnyActive && (
                  <p className="mt-2 hidden text-sm text-white/70 transition-colors group-hover:text-[#D4AF37] md:block">
                    Click to view details →
                  </p>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
