"use server";

import { headers } from "next/headers";
import { randomInt } from "crypto";
import { connectDB } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  containsMongoOperators,
  extractClientIp,
  hashClientIp,
  stripMongoOperators,
  toSafeErrorMessage,
} from "@/lib/security";
import { bookingCreateSchema } from "@/lib/validations";
import { getUsdToLkrRate } from "@/lib/env";
import { BookingModel } from "@/models/Booking";
import { PackageModel } from "@/models/Package";
import { BookingDTO, calculateEstimatedTotals } from "@/types";

export interface CreateBookingResult {
  success: boolean;
  booking?: BookingDTO;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

async function generateUniqueBookingRef(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomInt(1000, 9999);
    const ref = `SRD-${year}-${code}`;
    const exists = await BookingModel.exists({ bookingRef: ref });
    if (!exists) return ref;
  }
  return `SRD-${year}-${Date.now().toString().slice(-5)}`;
}

export async function processBookingSubmission(
  rawInput: unknown
): Promise<CreateBookingResult> {
  try {
    if (containsMongoOperators(rawInput)) {
      return {
        success: false,
        error: "Invalid characters detected in request.",
      };
    }

    const headerStore = await headers();
    const clientIp = extractClientIp(headerStore);
    const ipHash = hashClientIp(clientIp);

    const rateCheck = checkRateLimit(`booking:${ipHash}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many booking requests. Please wait ${Math.ceil(
          rateCheck.retryAfterSeconds / 60
        )} minute(s) before trying again.`,
      };
    }

    const sanitized = stripMongoOperators(rawInput);
    const parsed = bookingCreateSchema.safeParse(sanitized);
    if (!parsed.success) {
      return {
        success: false,
        error: "Please review the highlighted booking fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;

    // Honeypot check: silently reject bot submissions without revealing detection
    if (data.website && data.website.length > 0) {
      return {
        success: false,
        error: "Unable to process booking request.",
      };
    }

    await connectDB();

    let packageBasePriceUsd: number | undefined;
    let packageBasePriceLkr: number | undefined;
    let packageTitle: string | undefined;
    let packageSlug: string | null = null;
    let validPackageId: string | null = null;

    if (data.packageId) {
      const pkg = await PackageModel.findById(data.packageId).lean();
      if (pkg && pkg.isActive) {
        packageBasePriceUsd = pkg.priceUsd;
        packageBasePriceLkr = pkg.localPriceLkr;
        packageTitle = pkg.title;
        packageSlug = pkg.slug;
        validPackageId = pkg._id.toString();
      }
    }

    const { totalUsd: estimatedTotalUsd, totalLkr: estimatedTotalLkr } =
      calculateEstimatedTotals({
        visitorType: data.visitorType,
        durationDays: data.durationDays,
        adults: data.adults,
        children: data.children,
        tier: data.tier,
        airportPickup: data.airportPickup,
        packageBasePriceUsd,
        packageBasePriceLkr,
        usdToLkrRate: getUsdToLkrRate(),
      });

    const bookingRef = await generateUniqueBookingRef();

    const created = await BookingModel.create({
      bookingRef,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      visitorType: data.visitorType,
      destination: data.destination,
      packageId: validPackageId,
      packageSlug,
      travelDate: new Date(data.travelDate),
      durationDays: data.durationDays,
      adults: data.adults,
      children: data.children,
      tier: data.tier,
      airportPickup: data.airportPickup,
      specialRequests: data.specialRequests,
      estimatedTotalUsd,
      estimatedTotalLkr,
      status: "Pending",
      clientIpHash: ipHash,
    });

    return {
      success: true,
      booking: {
        id: created._id.toString(),
        bookingRef: created.bookingRef,
        fullName: created.fullName,
        email: created.email,
        phone: created.phone,
        visitorType: created.visitorType,
        destination: created.destination,
        packageId: created.packageId ? created.packageId.toString() : null,
        packageTitle,
        travelDate: created.travelDate.toISOString(),
        durationDays: created.durationDays,
        adults: created.adults,
        children: created.children,
        tier: created.tier,
        airportPickup: created.airportPickup,
        specialRequests: created.specialRequests,
        estimatedTotalUsd: created.estimatedTotalUsd,
        estimatedTotalLkr: created.estimatedTotalLkr,
        status: created.status,
        createdAt: created.createdAt.toISOString(),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: toSafeErrorMessage(
        err,
        "We could not confirm your booking right now. Please verify database configuration and try again."
      ),
    };
  }
}

export async function createBooking(
  input: unknown
): Promise<CreateBookingResult> {
  return processBookingSubmission(input);
}
