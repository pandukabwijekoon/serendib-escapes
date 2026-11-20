import { z } from "zod";
import {
  BOOKING_STATUSES,
  DESTINATIONS,
  TRAVEL_TIERS,
  VISITOR_TYPES,
} from "@/types";
import { sanitizeText } from "@/lib/security";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const phoneRegex = /^\+[1-9]\d{6,14}$/;

export const bookingCreateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name is too long.")
    .transform(sanitizeText),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .max(160)
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(
      phoneRegex,
      "Include country code in E.164 format (e.g., +94771234567 or +447911123456)."
    ),
  visitorType: z.enum(VISITOR_TYPES).default("International"),
  destination: z.enum(DESTINATIONS),
  packageId: z
    .string()
    .trim()
    .regex(objectIdRegex, "Invalid package reference.")
    .optional()
    .nullable()
    .or(z.literal("")),
  travelDate: z
    .string()
    .trim()
    .refine((val) => {
      const parsed = new Date(val);
      if (Number.isNaN(parsed.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsed >= today;
    }, "Check-in date must be today or in the future."),
  durationDays: z.coerce
    .number()
    .int()
    .min(1, "Minimum stay is 1 day.")
    .max(30, "Maximum online itinerary is 30 days."),
  adults: z.coerce
    .number()
    .int()
    .min(1, "At least 1 adult is required.")
    .max(16, "Maximum 16 adults per online booking."),
  children: z.coerce
    .number()
    .int()
    .min(0)
    .max(12, "Maximum 12 children per online booking."),
  tier: z.enum(TRAVEL_TIERS),
  airportPickup: z.boolean().default(true),
  specialRequests: z
    .string()
    .trim()
    .max(800, "Special requests cannot exceed 800 characters.")
    .optional()
    .default("")
    .transform(sanitizeText),
  // Hidden honeypot field: bots filling this will be silently rejected
  website: z.string().max(0, "Bot detected.").optional().default(""),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Valid email required.").max(160),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

export const bookingStatusUpdateSchema = z.object({
  bookingId: z.string().trim().regex(objectIdRegex, "Invalid booking ID."),
  status: z.enum(BOOKING_STATUSES),
});

export const packageUpsertSchema = z.object({
  id: z.string().trim().regex(objectIdRegex).optional(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens."),
  title: z.string().trim().min(3).max(120).transform(sanitizeText),
  destination: z.enum(DESTINATIONS),
  tagline: z.string().trim().min(4).max(180).transform(sanitizeText),
  durationDays: z.coerce.number().int().min(1).max(30),
  priceUsd: z.coerce.number().min(50).max(50000),
  localPriceLkr: z.coerce.number().min(5000).max(5000000),
  themeColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid 6-digit hex color."),
  coverImage: z.string().trim().min(1).max(400),
  cutoutImage: z.string().trim().min(1).max(400),
  highlights: z
    .array(z.string().trim().min(2).max(160).transform(sanitizeText))
    .min(1)
    .max(8),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type PackageUpsertInput = z.infer<typeof packageUpsertSchema>;
