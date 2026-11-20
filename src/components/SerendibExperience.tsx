"use client";

import { useState } from "react";
import { DestinationKey, TourPackageDTO, VisitorType } from "@/types";
import { Navbar } from "@/components/Navbar";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import { DestinationMorphDeck } from "@/components/DestinationMorphDeck";
import { IslandScrollytelling } from "@/components/IslandScrollytelling";
import { PackagesShowcase } from "@/components/PackagesShowcase";
import { BookingPanel } from "@/components/BookingPanel";
import { Footer } from "@/components/Footer";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";

interface SerendibExperienceProps {
  packages: TourPackageDTO[];
  usdToLkrRate: number;
}

export function SerendibExperience({
  packages,
  usdToLkrRate,
}: SerendibExperienceProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSession, setBookingSession] = useState(0);
  const [selectedDestination, setSelectedDestination] =
    useState<DestinationKey>("Sigiriya");
  const [selectedPackage, setSelectedPackage] =
    useState<TourPackageDTO | null>(null);
  const [selectedVisitorType, setSelectedVisitorType] =
    useState<VisitorType>("International");

  function handleBookDestination(destination: DestinationKey) {
    setSelectedDestination(destination);
    setSelectedPackage(null);
    setSelectedVisitorType("International");
    setBookingSession((s) => s + 1);
    setBookingOpen(true);
  }

  function handleSelectPackage(pkg: TourPackageDTO, visitorType: VisitorType) {
    setSelectedDestination(pkg.destination);
    setSelectedPackage(pkg);
    setSelectedVisitorType(visitorType);
    setBookingSession((s) => s + 1);
    setBookingOpen(true);
  }

  function handleOpenGeneralBooking() {
    setSelectedPackage(null);
    setBookingSession((s) => s + 1);
    setBookingOpen(true);
  }

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-[#0A0F0D] text-white">
        <Navbar onOpenBooking={handleOpenGeneralBooking} />

        <main>
          <IslandScrollytelling
            onStartCustomItinerary={handleOpenGeneralBooking}
          />

          <DestinationMorphDeck onBookDestination={handleBookDestination} />

          <PackagesShowcase
            packages={packages}
            usdToLkrRate={usdToLkrRate}
            onSelectPackage={handleSelectPackage}
          />

          {/* Custom Trip Callout */}
          <section className="no-print border-t border-white/10 bg-[#0D1411] px-6 py-20 sm:px-10">
            <div className="glass-gold mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-3xl p-8 sm:p-12 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <span className="text-sm font-semibold text-[#D4AF37]">
                  Custom Trip Planner
                </span>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">
                  Want to Visit Multiple Places in One Trip?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                  Combine Sigiriya, Ella, Mirissa, and Yala into one easy holiday
                  with your own private driver, great hotels, and 24/7 support.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenGeneralBooking}
                className="shrink-0 rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-semibold text-[#0A0F0D] shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#E7C660]"
              >
                Plan Custom Trip
              </button>
            </div>
          </section>
        </main>

        <Footer />

        <WhatsAppWidget />

        <BookingPanel
          key={bookingSession}
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          initialDestination={selectedDestination}
          initialPackage={selectedPackage}
          initialVisitorType={selectedVisitorType}
          packages={packages}
          usdToLkrRate={usdToLkrRate}
        />
      </div>
    </SmoothScrollProvider>
  );
}
