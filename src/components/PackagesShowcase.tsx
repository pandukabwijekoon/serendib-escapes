"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import {
  DESTINATIONS,
  DestinationKey,
  TourPackageDTO,
  VisitorType,
} from "@/types";

interface PackagesShowcaseProps {
  packages: TourPackageDTO[];
  usdToLkrRate: number;
  onSelectPackage: (pkg: TourPackageDTO, visitorType: VisitorType) => void;
}

export function PackagesShowcase({
  packages,
  usdToLkrRate,
  onSelectPackage,
}: PackagesShowcaseProps) {
  const [selectedDestination, setSelectedDestination] = useState<
    "All" | DestinationKey
  >("All");
  const [visitorType, setVisitorType] = useState<VisitorType>("International");
  const [currency, setCurrency] = useState<"USD" | "LKR">("USD");

  const filtered = useMemo(() => {
    if (selectedDestination === "All") return packages;
    return packages.filter((p) => p.destination === selectedDestination);
  }, [packages, selectedDestination]);

  function formatPackagePrice(pkg: TourPackageDTO) {
    if (visitorType === "Sri Lankan Resident") {
      return `LKR ${pkg.localPriceLkr.toLocaleString()}`;
    }
    if (currency === "USD") {
      return `$${pkg.priceUsd.toLocaleString()}`;
    }
    const lkr = Math.round(pkg.priceUsd * usdToLkrRate);
    return `LKR ${lkr.toLocaleString()}`;
  }

  return (
    <section
      id="packages"
      className="relative bg-[#0A0F0D] px-6 py-24 sm:px-10 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <span className="text-sm font-semibold text-[#D4AF37]">
              Tour Packages
            </span>
            <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Popular Sri Lanka Tours
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              Choose Foreign Visitors or Sri Lankan Locals below to see fair
              prices for your trip.
            </p>
          </div>

          {/* Visitor Type & Currency Controls */}
          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:gap-3">
            <div className="flex w-full items-center gap-1 rounded-full border border-white/15 bg-[#111815] p-1 sm:w-auto sm:p-1.5">
              {(
                [
                  { value: "International", label: "Foreign Visitors" },
                  { value: "Sri Lankan Resident", label: "Sri Lankan Locals" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setVisitorType(tab.value)}
                  className={`flex-1 rounded-full px-3 py-1.5 text-center text-xs font-medium transition sm:flex-none sm:px-4 sm:text-sm ${
                    visitorType === tab.value
                      ? "bg-[#D4AF37] text-[#0A0F0D]"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {visitorType === "International" && (
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#111815] p-1.5">
                {(["USD", "LKR"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setCurrency(unit)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      currency === unit
                        ? "bg-white/15 text-[#D4AF37]"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Destination Filter Pills */}
        <div className="mt-10 flex flex-wrap gap-2.5">
          {(["All", ...DESTINATIONS] as const).map((dest) => {
            const active = selectedDestination === dest;
            return (
              <button
                key={dest}
                type="button"
                onClick={() => setSelectedDestination(dest)}
                className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${
                  active
                    ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                    : "border-white/10 bg-[#111815]/70 text-white/75 hover:border-white/25 hover:text-white"
                }`}
              >
                {dest === "All" ? "All Places" : dest}
              </button>
            );
          })}
        </div>

        {/* Animated Package Grid */}
        <motion.div
          layout
          className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((pkg) => (
              <motion.article
                key={pkg.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111815] shadow-2xl shadow-black/40 transition-colors hover:border-[#D4AF37]/45"
              >
                {/* Cover Image */}
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={pkg.coverImage}
                    alt={pkg.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111815] via-[#111815]/20 to-transparent" />

                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white shadow-md"
                      style={{ backgroundColor: pkg.themeColor }}
                    >
                      {pkg.destination}
                    </span>
                    {pkg.isFeatured && (
                      <span className="rounded-full border border-[#D4AF37]/50 bg-[#0A0F0D]/75 px-3 py-1 text-xs font-medium text-[#D4AF37] backdrop-blur-md">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="absolute right-4 bottom-4 rounded-full border border-white/15 bg-[#0A0F0D]/75 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-md">
                    {pkg.durationDays} Days
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-serif text-2xl font-semibold leading-snug text-white">
                    {pkg.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {pkg.tagline}
                  </p>

                  <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm text-white/80">
                    {pkg.highlights.slice(0, 4).map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-2.5 h-px w-3 shrink-0 bg-[#D4AF37]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
                    <div>
                      <span className="block text-xs text-white/55">
                        {visitorType === "Sri Lankan Resident"
                          ? "Local Price • Per Person"
                          : "Per Person"}
                      </span>
                      <span className="font-serif text-2xl font-semibold text-[#D4AF37]">
                        {formatPackagePrice(pkg)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectPackage(pkg, visitorType)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#0A0F0D]"
                    >
                      <span>Book Package</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
