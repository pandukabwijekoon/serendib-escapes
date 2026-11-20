export const DESTINATIONS = ["Sigiriya", "Ella", "Mirissa", "Yala"] as const;
export type DestinationKey = (typeof DESTINATIONS)[number];

export const VISITOR_TYPES = ["International", "Sri Lankan Resident"] as const;
export type VisitorType = (typeof VISITOR_TYPES)[number];

export const TRAVEL_TIERS = [
  "Boutique Luxury",
  "Private Villa & Chauffeur",
  "Adventure & Wildlife",
] as const;
export type TravelTier = (typeof TRAVEL_TIERS)[number];

export const BOOKING_STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface DestinationSlide {
  key: DestinationKey;
  title: string;
  subtitle: string;
  region: string;
  bestSeason: string;
  accentColor: string;
  accentGlow: string;
  startingPriceUsd: number;
  localStartingPriceLkr: number;
  coverImage: string;
  cutoutImage: string;
  description: string;
  highlights: string[];
}

export interface TourPackageDTO {
  id: string;
  slug: string;
  title: string;
  destination: DestinationKey;
  tagline: string;
  durationDays: number;
  priceUsd: number;
  localPriceLkr: number;
  themeColor: string;
  coverImage: string;
  cutoutImage: string;
  highlights: string[];
  isFeatured: boolean;
  isActive: boolean;
}

export interface BookingDTO {
  id: string;
  bookingRef: string;
  fullName: string;
  email: string;
  phone: string;
  visitorType: VisitorType;
  destination: DestinationKey;
  packageId?: string | null;
  packageTitle?: string;
  travelDate: string;
  durationDays: number;
  adults: number;
  children: number;
  tier: TravelTier;
  airportPickup: boolean;
  specialRequests?: string;
  estimatedTotalUsd: number;
  estimatedTotalLkr: number;
  status: BookingStatus;
  createdAt: string;
}

export const TIER_DAILY_RATES_USD: Record<TravelTier, number> = {
  "Boutique Luxury": 115,
  "Private Villa & Chauffeur": 195,
  "Adventure & Wildlife": 145,
};

export const TIER_DAILY_RATES_LKR: Record<TravelTier, number> = {
  "Boutique Luxury": 16500,
  "Private Villa & Chauffeur": 28000,
  "Adventure & Wildlife": 21000,
};

export const AIRPORT_PICKUP_FEE_USD = 45;
export const AIRPORT_PICKUP_FEE_LKR = 9500;

export function calculateEstimatedTotals(params: {
  visitorType: VisitorType;
  durationDays: number;
  adults: number;
  children: number;
  tier: TravelTier;
  airportPickup: boolean;
  packageBasePriceUsd?: number;
  packageBasePriceLkr?: number;
  usdToLkrRate?: number;
}): { totalUsd: number; totalLkr: number } {
  const {
    visitorType,
    durationDays,
    adults,
    children,
    tier,
    airportPickup,
    packageBasePriceUsd,
    packageBasePriceLkr,
    usdToLkrRate = 300,
  } = params;

  const effectiveGuests = Math.max(1, adults) + Math.max(0, children) * 0.5;

  if (visitorType === "Sri Lankan Resident") {
    const dailyLkr =
      TIER_DAILY_RATES_LKR[tier] ?? TIER_DAILY_RATES_LKR["Boutique Luxury"];
    const baseLkr = packageBasePriceLkr
      ? packageBasePriceLkr * effectiveGuests * (durationDays / 4)
      : dailyLkr * durationDays * effectiveGuests;
    const pickupLkr = airportPickup ? AIRPORT_PICKUP_FEE_LKR : 0;
    const totalLkr = Math.round(baseLkr + pickupLkr);
    const totalUsd = Math.round(totalLkr / usdToLkrRate);
    return { totalUsd, totalLkr };
  }

  const dailyUsd =
    TIER_DAILY_RATES_USD[tier] ?? TIER_DAILY_RATES_USD["Boutique Luxury"];
  const baseUsd = packageBasePriceUsd
    ? packageBasePriceUsd * effectiveGuests * (durationDays / 4)
    : dailyUsd * durationDays * effectiveGuests;
  const pickupUsd = airportPickup ? AIRPORT_PICKUP_FEE_USD : 0;
  const totalUsd = Math.round(baseUsd + pickupUsd);
  const totalLkr = Math.round(totalUsd * usdToLkrRate);
  return { totalUsd, totalLkr };
}

export const DESTINATION_SLIDES: DestinationSlide[] = [
  {
    key: "Sigiriya",
    title: "Sigiriya",
    subtitle: "Lion Rock",
    region: "Matale District, Central Sri Lanka",
    bestSeason: "January – April & July – September",
    accentColor: "#C87D16",
    accentGlow: "rgba(200, 125, 22, 0.35)",
    startingPriceUsd: 295,
    localStartingPriceLkr: 38500,
    coverImage: "/images/sigiriya-cover.jpg",
    cutoutImage: "/images/sigiriya-cutout.jpg",
    description:
      "Climb the famous ancient Lion Rock fortress, stay in a quiet jungle hotel, and enjoy authentic Sri Lankan meals surrounded by nature.",
    highlights: [
      "Early morning guided walk up Sigiriya Rock",
      "Comfortable jungle hotel with views of Pidurangala",
      "Relaxing Ayurvedic spa & local spice garden visit",
    ],
  },
  {
    key: "Ella",
    title: "Ella",
    subtitle: "Hill Country",
    region: "Badulla District, Hill Country",
    bestSeason: "December – May",
    accentColor: "#0B5D47",
    accentGlow: "rgba(11, 93, 71, 0.38)",
    startingPriceUsd: 260,
    localStartingPriceLkr: 32000,
    coverImage: "/images/ella-cover.jpg",
    cutoutImage: "/images/ella-cutout.jpg",
    description:
      "Wake up to cool mountain air and green tea estates, take the scenic train across Nine Arch Bridge, and unwind in a hillside hotel.",
    highlights: [
      "Scenic train ride over the famous Nine Arch Bridge",
      "Fresh Ceylon tea tasting at a local tea estate",
      "Easy sunrise walk up Little Adam's Peak",
    ],
  },
  {
    key: "Mirissa",
    title: "Mirissa",
    subtitle: "Southern Beaches",
    region: "Matara District, Southern Coast",
    bestSeason: "November – April",
    accentColor: "#0F4C75",
    accentGlow: "rgba(15, 76, 117, 0.40)",
    startingPriceUsd: 320,
    localStartingPriceLkr: 42000,
    coverImage: "/images/mirissa-cover.jpg",
    cutoutImage: "/images/mirissa-cutout.jpg",
    description:
      "Take a morning boat trip to spot blue whales and dolphins, relax on golden sandy beaches, and enjoy fresh seafood by the ocean.",
    highlights: [
      "Morning boat trip for whale & dolphin watching",
      "Sunset dinner near Coconut Tree Hill",
      "Clean beachfront hotel with ocean views",
    ],
  },
  {
    key: "Yala",
    title: "Yala",
    subtitle: "Wildlife Safari",
    region: "Hambantota District, Deep South",
    bestSeason: "February – July",
    accentColor: "#9B1C1C",
    accentGlow: "rgba(155, 28, 28, 0.40)",
    startingPriceUsd: 360,
    localStartingPriceLkr: 48000,
    coverImage: "/images/yala-cover.jpg",
    cutoutImage: "/images/yala-cutout.jpg",
    description:
      "Go on an exciting 4x4 jeep safari to spot Sri Lankan leopards and elephants, then relax in an air-conditioned safari camp near the park.",
    highlights: [
      "Morning and evening 4x4 wildlife jeep safaris",
      "Air-conditioned safari tented hotel stay",
      "Outdoor BBQ dinner under the stars",
    ],
  },
];
