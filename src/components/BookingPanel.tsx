"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarCheck2,
  CheckCircle2,
  Download,
  Loader2,
  Plane,
  Printer,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { createBooking } from "@/actions/bookingActions";
import {
  AIRPORT_PICKUP_FEE_LKR,
  AIRPORT_PICKUP_FEE_USD,
  BookingDTO,
  calculateEstimatedTotals,
  DESTINATIONS,
  DestinationKey,
  TourPackageDTO,
  TRAVEL_TIERS,
  TravelTier,
  VISITOR_TYPES,
  VisitorType,
} from "@/types";

interface BookingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialDestination?: DestinationKey;
  initialPackage?: TourPackageDTO | null;
  initialVisitorType?: VisitorType;
  packages: TourPackageDTO[];
  usdToLkrRate: number;
}

export function BookingPanel({
  isOpen,
  onClose,
  initialDestination = "Sigiriya",
  initialPackage = null,
  initialVisitorType = "International",
  packages,
  usdToLkrRate,
}: BookingPanelProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [visitorType, setVisitorType] =
    useState<VisitorType>(initialVisitorType);
  const [destination, setDestination] =
    useState<DestinationKey>(initialDestination);
  const [packageId, setPackageId] = useState<string>(initialPackage?.id ?? "");
  const [travelDate, setTravelDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [durationDays, setDurationDays] = useState<number>(
    initialPackage?.durationDays ?? 3
  );
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [tier, setTier] = useState<TravelTier>("Boutique Luxury");
  const [airportPickup, setAirportPickup] = useState<boolean>(
    initialVisitorType === "International"
  );
  const [specialRequests, setSpecialRequests] = useState<string>("");

  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [website, setWebsite] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingDTO | null>(
    null
  );

  const isLocal = visitorType === "Sri Lankan Resident";

  const activePackage = useMemo(
    () => packages.find((p) => p.id === packageId) ?? null,
    [packages, packageId]
  );

  const destinationPackages = useMemo(
    () => packages.filter((p) => p.destination === destination),
    [packages, destination]
  );

  const { totalUsd: estimatedTotalUsd, totalLkr: estimatedTotalLkr } = useMemo(
    () =>
      calculateEstimatedTotals({
        visitorType,
        durationDays,
        adults,
        children,
        tier,
        airportPickup,
        packageBasePriceUsd: activePackage?.priceUsd,
        packageBasePriceLkr: activePackage?.localPriceLkr,
        usdToLkrRate,
      }),
    [
      visitorType,
      durationDays,
      adults,
      children,
      tier,
      airportPickup,
      activePackage,
      usdToLkrRate,
    ]
  );

  function handleVisitorTypeChange(nextType: VisitorType) {
    setVisitorType(nextType);
    if (nextType === "Sri Lankan Resident") {
      setAirportPickup(false);
    } else {
      setAirportPickup(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const isMongoId = /^[a-fA-F0-9]{24}$/.test(packageId);

    const result = await createBooking({
      fullName,
      email,
      phone,
      visitorType,
      destination,
      packageId: isMongoId ? packageId : "",
      travelDate,
      durationDays,
      adults,
      children,
      tier,
      airportPickup,
      specialRequests,
      website,
    });

    setIsSubmitting(false);

    if (!result.success || !result.booking) {
      const firstFieldErr = result.fieldErrors
        ? Object.values(result.fieldErrors).flat()[0]
        : undefined;
      setErrorMsg(
        firstFieldErr || result.error || "Unable to complete booking."
      );
      return;
    }

    setConfirmedBooking(result.booking);
    setStep(3);
  }

  function handleDownloadPass() {
    if (!confirmedBooking) return;
    const isResidentBooking =
      confirmedBooking.visitorType === "Sri Lankan Resident";
    const totalLine = isResidentBooking
      ? `LKR ${confirmedBooking.estimatedTotalLkr.toLocaleString()} (Resident Rate)`
      : `$${confirmedBooking.estimatedTotalUsd.toLocaleString()} USD`;

    const content = [
      "==================================================",
      "SERENDIB ESCAPES — DIGITAL BOOKING PASS",
      "Crafted by Zora Solutions",
      "==================================================",
      `Booking Reference : ${confirmedBooking.bookingRef}`,
      `Status            : ${confirmedBooking.status}`,
      `Guest Residency   : ${confirmedBooking.visitorType}`,
      `Guest Name        : ${confirmedBooking.fullName}`,
      `Email             : ${confirmedBooking.email}`,
      `WhatsApp / Phone  : ${confirmedBooking.phone}`,
      `Destination       : ${confirmedBooking.destination}`,
      `Package           : ${confirmedBooking.packageTitle || "Tailored Private Itinerary"}`,
      `Check-In Date     : ${new Date(confirmedBooking.travelDate).toDateString()}`,
      `Duration          : ${confirmedBooking.durationDays} Days`,
      `Guests            : ${confirmedBooking.adults} Adults, ${confirmedBooking.children} Children`,
      `Travel Tier       : ${confirmedBooking.tier}`,
      `Airport Pickup    : ${confirmedBooking.airportPickup ? "Included (VIP Chauffeur)" : "Not Requested"}`,
      `Estimated Total   : ${totalLine}`,
      "==================================================",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${confirmedBooking.bookingRef}-Serendib-Pass.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="no-print fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Slide-over Drawer */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Reserve Your Sri Lanka Escape"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-[100dvh] w-full max-w-xl flex-col border-l border-white/15 bg-[#0D1411] text-white shadow-2xl"
          >
            {/* Header */}
            <div className="no-print flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <span className="text-xs font-semibold text-[#D4AF37]">
                  Easy Online Booking
                </span>
                <h2 className="font-serif text-2xl font-semibold text-white">
                  {step === 3 ? "Your Booking Confirmation" : "Book Your Trip"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close booking panel"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Indicator */}
            {step !== 3 && (
              <div className="no-print flex items-center gap-3 border-b border-white/10 px-6 py-3 text-xs">
                <span
                  className={`rounded-full px-3 py-1 font-medium ${
                    step === 1
                      ? "bg-[#D4AF37] text-[#0A0F0D]"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  1. Trip Details
                </span>
                <span className="text-white/30">→</span>
                <span
                  className={`rounded-full px-3 py-1 font-medium ${
                    step === 2
                      ? "bg-[#D4AF37] text-[#0A0F0D]"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  2. Your Contact Info
                </span>
              </div>
            )}

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {step === 1 && (
                <div className="space-y-5">
                  {/* Visitor Type Selector (Separate Local vs International) */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/75">
                      Visitor Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {VISITOR_TYPES.map((vt) => (
                        <button
                          key={vt}
                          type="button"
                          onClick={() => handleVisitorTypeChange(vt)}
                          className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                            visitorType === vt
                              ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                              : "border-white/10 bg-[#111815] text-white/75 hover:border-white/25"
                          }`}
                        >
                          {vt === "Sri Lankan Resident"
                            ? "Sri Lankan Local (LKR)"
                            : "Foreign Visitor (USD)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/75">
                      Where do you want to go?
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {DESTINATIONS.map((dest) => (
                        <button
                          key={dest}
                          type="button"
                          onClick={() => {
                            setDestination(dest);
                            setPackageId("");
                          }}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                            destination === dest
                              ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                              : "border-white/10 bg-[#111815] text-white/75 hover:border-white/25"
                          }`}
                        >
                          {dest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="booking-package"
                      className="mb-2 block text-xs font-medium text-white/75"
                    >
                      Choose a Package (Optional)
                    </label>
                    <select
                      id="booking-package"
                      value={packageId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackageId(val);
                        const found = packages.find((p) => p.id === val);
                        if (found) setDurationDays(found.durationDays);
                      }}
                      className="w-full rounded-xl border border-white/15 bg-[#111815] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                    >
                      <option value="">
                        Custom {destination} Trip
                      </option>
                      {destinationPackages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.title} ({pkg.durationDays} Days —{" "}
                          {isLocal
                            ? `LKR ${pkg.localPriceLkr.toLocaleString()}`
                            : `$${pkg.priceUsd.toLocaleString()}`}
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="travel-date"
                        className="mb-2 block text-xs font-medium text-white/75"
                      >
                        Start Date
                      </label>
                      <input
                        id="travel-date"
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-[#111815] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="duration-days"
                        className="mb-2 block text-xs font-medium text-white/75"
                      >
                        Number of Days
                      </label>
                      <input
                        id="duration-days"
                        type="number"
                        min={1}
                        max={30}
                        value={durationDays}
                        onChange={(e) =>
                          setDurationDays(
                            Math.max(1, Math.min(30, Number(e.target.value) || 1))
                          )
                        }
                        className="w-full rounded-xl border border-white/15 bg-[#111815] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="adults-count"
                        className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/75"
                      >
                        <Users className="h-3.5 w-3.5 text-[#D4AF37]" />
                        Adults
                      </label>
                      <input
                        id="adults-count"
                        type="number"
                        min={1}
                        max={16}
                        value={adults}
                        onChange={(e) =>
                          setAdults(
                            Math.max(1, Math.min(16, Number(e.target.value) || 1))
                          )
                        }
                        className="w-full rounded-xl border border-white/15 bg-[#111815] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="children-count"
                        className="mb-2 block text-xs font-medium text-white/75"
                      >
                        Children
                      </label>
                      <input
                        id="children-count"
                        type="number"
                        min={0}
                        max={12}
                        value={children}
                        onChange={(e) =>
                          setChildren(
                            Math.max(0, Math.min(12, Number(e.target.value) || 0))
                          )
                        }
                        className="w-full rounded-xl border border-white/15 bg-[#111815] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/75">
                      Hotel &amp; Comfort Level
                    </label>
                    <div className="space-y-2">
                      {TRAVEL_TIERS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTier(t)}
                          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                            tier === t
                              ? "border-[#D4AF37] bg-[#D4AF37]/15 text-white"
                              : "border-white/10 bg-[#111815] text-white/75 hover:border-white/25"
                          }`}
                        >
                          <span className="font-medium">{t}</span>
                          {tier === t && (
                            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/15 bg-[#111815] px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Plane className="h-4 w-4 text-[#D4AF37]" />
                      <div>
                        <span className="block text-sm font-medium text-white">
                          Airport / Hotel Pickup
                        </span>
                        <span className="block text-xs text-white/60">
                          {isLocal
                            ? `Optional Colombo / Airport pickup (+LKR ${AIRPORT_PICKUP_FEE_LKR.toLocaleString()})`
                            : `Private airport pickup (+$${AIRPORT_PICKUP_FEE_USD})`}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={airportPickup}
                      onChange={(e) => setAirportPickup(e.target.checked)}
                      className="h-4 w-4 accent-[#D4AF37]"
                    />
                  </label>
                </div>
              )}

              {step === 2 && (
                <form
                  id="booking-form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website-hp">Website</label>
                    <input
                      id="website-hp"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guest-name"
                      className="mb-2 block text-xs font-medium text-white/75"
                    >
                      Full Name *
                    </label>
                    <input
                      id="guest-name"
                      required
                      type="text"
                      placeholder={
                        isLocal ? "e.g., Kasun Jayasinghe" : "e.g., Elena Vance"
                      }
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#111815] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guest-email"
                      className="mb-2 block text-xs font-medium text-white/75"
                    >
                      Email Address *
                    </label>
                    <input
                      id="guest-email"
                      required
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#111815] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guest-phone"
                      className="mb-2 block text-xs font-medium text-white/75"
                    >
                      Phone / WhatsApp Number (with country code) *
                    </label>
                    <input
                      id="guest-phone"
                      required
                      type="tel"
                      placeholder={isLocal ? "+94771234567" : "+447911123456"}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#111815] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="special-requests"
                      className="mb-2 block text-xs font-medium text-white/75"
                    >
                      {isLocal
                        ? "Special Requests (Food, Room Preferences, NIC)"
                        : "Special Requests (Food, Room Preferences, etc.)"}
                    </label>
                    <textarea
                      id="special-requests"
                      rows={3}
                      placeholder={
                        isLocal
                          ? "Vegetarian meals, extra bed, optional NIC number..."
                          : "Halal or vegan food, baby seat, honeymoon decoration..."
                      }
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#111815] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-xs text-red-200">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                    <span>Your booking details are private and secure.</span>
                  </div>
                </form>
              )}

              {step === 3 && confirmedBooking && (
                <div className="glass-gold rounded-3xl p-6 text-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/15 pb-4">
                    <div className="flex items-center gap-2.5 text-[#D4AF37]">
                      <CheckCircle2 className="h-6 w-6" />
                      <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                        Reservation Received
                      </span>
                    </div>
                    <span className="rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-[#0A0F0D]">
                      {confirmedBooking.bookingRef}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Guest Residency</span>
                      <span className="font-medium text-[#D4AF37]">
                        {confirmedBooking.visitorType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Lead Guest</span>
                      <span className="font-medium">
                        {confirmedBooking.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Sanctuary</span>
                      <span className="font-medium">
                        {confirmedBooking.destination}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Check-In</span>
                      <span className="font-medium">
                        {new Date(
                          confirmedBooking.travelDate
                        ).toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Duration & Party</span>
                      <span className="font-medium">
                        {confirmedBooking.durationDays} Days •{" "}
                        {confirmedBooking.adults}A{" "}
                        {confirmedBooking.children > 0
                          ? `/ ${confirmedBooking.children}C`
                          : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Tier</span>
                      <span className="font-medium">
                        {confirmedBooking.tier}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-white/15 pt-3 text-base">
                      <span className="text-white/75">Estimated Total</span>
                      <span className="font-serif text-xl font-semibold text-[#D4AF37]">
                        {confirmedBooking.visitorType === "Sri Lankan Resident"
                          ? `LKR ${confirmedBooking.estimatedTotalLkr.toLocaleString()}`
                          : `$${confirmedBooking.estimatedTotalUsd.toLocaleString()} USD`}
                      </span>
                    </div>
                  </div>

                  <div className="no-print mt-6 flex flex-wrap gap-3">
                    <a
                      href={`https://wa.me/${(
                        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94771234567"
                      ).replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                        `Hello Serendib Escapes! I just booked my trip. Reference: ${confirmedBooking.bookingRef}, Name: ${confirmedBooking.fullName}, Place: ${confirmedBooking.destination} (${confirmedBooking.durationDays} days).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-[#062112] transition hover:bg-[#2CE070]"
                    >
                      <span>Send Booking Ref on WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleDownloadPass}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2.5 text-xs font-semibold text-[#0A0F0D] transition hover:bg-[#E7C660]"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Pass</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Price Estimator & Actions */}
            {step !== 3 && (
              <div className="no-print border-t border-white/10 bg-[#0A0F0D] px-6 py-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <div>
                    <span className="block text-xs text-white/60">
                      {isLocal ? "Local Price Total" : "Estimated Total"}
                    </span>
                    <span className="font-serif text-2xl font-semibold text-[#D4AF37]">
                      {isLocal
                        ? `LKR ${estimatedTotalLkr.toLocaleString()}`
                        : `$${estimatedTotalUsd.toLocaleString()} USD`}
                    </span>
                  </div>
                  <span className="text-xs text-white/60">
                    {isLocal
                      ? "Sri Lankan Local Rate"
                      : `≈ LKR ${estimatedTotalLkr.toLocaleString()}`}
                  </span>
                </div>

                {step === 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] py-3 text-sm font-semibold text-[#0A0F0D] transition hover:bg-[#E7C660]"
                  >
                    <CalendarCheck2 className="h-4 w-4" />
                    <span>Next: Your Details</span>
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white/85 hover:border-white/40"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      form="booking-form"
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#D4AF37] py-3 text-sm font-semibold text-[#0A0F0D] transition hover:bg-[#E7C660] disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Confirming...</span>
                        </>
                      ) : (
                        <span>Confirm Booking</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
