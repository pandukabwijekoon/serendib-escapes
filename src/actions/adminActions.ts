"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  containsMongoOperators,
  escapeRegex,
  stripMongoOperators,
  toSafeErrorMessage,
} from "@/lib/security";
import {
  bookingStatusUpdateSchema,
  packageUpsertSchema,
} from "@/lib/validations";
import { BookingModel } from "@/models/Booking";
import { PackageModel } from "@/models/Package";
import {
  BOOKING_STATUSES,
  BookingDTO,
  BookingStatus,
  TourPackageDTO,
} from "@/types";

export async function getAdminBookings(params?: {
  search?: string;
  status?: string;
}): Promise<{ success: boolean; bookings?: BookingDTO[]; error?: string }> {
  try {
    await requireAdmin();
    await connectDB();

    const query: Record<string, unknown> = {};

    if (
      params?.status &&
      params.status !== "All" &&
      BOOKING_STATUSES.includes(params.status as BookingStatus)
    ) {
      query.status = params.status;
    }

    if (params?.search && params.search.trim().length > 0) {
      const safeRegex = new RegExp(escapeRegex(params.search.trim()), "i");
      query.$or = [
        { bookingRef: safeRegex },
        { fullName: safeRegex },
        { email: safeRegex },
        { destination: safeRegex },
      ];
    }

    const docs = await BookingModel.find(query)
      .populate("packageId", "title")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const bookings: BookingDTO[] = docs.map((doc) => {
      const populatedPkg = doc.packageId as unknown as {
        _id?: { toString(): string };
        title?: string;
      } | null;

      return {
        id: doc._id.toString(),
        bookingRef: doc.bookingRef,
        fullName: doc.fullName,
        email: doc.email,
        phone: doc.phone,
        visitorType: doc.visitorType ?? "International",
        destination: doc.destination,
        packageId: populatedPkg?._id ? populatedPkg._id.toString() : null,
        packageTitle: populatedPkg?.title,
        travelDate: new Date(doc.travelDate).toISOString(),
        durationDays: doc.durationDays,
        adults: doc.adults,
        children: doc.children,
        tier: doc.tier,
        airportPickup: doc.airportPickup,
        specialRequests: doc.specialRequests,
        estimatedTotalUsd: doc.estimatedTotalUsd,
        estimatedTotalLkr:
          doc.estimatedTotalLkr ?? Math.round(doc.estimatedTotalUsd * 300),
        status: doc.status,
        createdAt: new Date(doc.createdAt).toISOString(),
      };
    });

    return { success: true, bookings };
  } catch (err) {
    return {
      success: false,
      error: toSafeErrorMessage(err, "Unable to fetch bookings."),
    };
  }
}

export async function updateBookingStatus(
  rawInput: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (containsMongoOperators(rawInput)) {
      return { success: false, error: "Invalid payload." };
    }

    const parsed = bookingStatusUpdateSchema.safeParse(
      stripMongoOperators(rawInput)
    );
    if (!parsed.success) {
      return { success: false, error: "Invalid status update request." };
    }

    await connectDB();
    const updated = await BookingModel.findByIdAndUpdate(
      parsed.data.bookingId,
      { $set: { status: parsed.data.status } },
      { new: true }
    );

    if (!updated) {
      return { success: false, error: "Booking not found." };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: toSafeErrorMessage(err, "Failed to update booking status."),
    };
  }
}

export async function getAdminPackages(): Promise<{
  success: boolean;
  packages?: TourPackageDTO[];
  error?: string;
}> {
  try {
    await requireAdmin();
    await connectDB();

    const docs = await PackageModel.find({})
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    const packages: TourPackageDTO[] = docs.map((doc) => ({
      id: doc._id.toString(),
      slug: doc.slug,
      title: doc.title,
      destination: doc.destination,
      tagline: doc.tagline,
      durationDays: doc.durationDays,
      priceUsd: doc.priceUsd,
      localPriceLkr: doc.localPriceLkr ?? Math.round(doc.priceUsd * 130),
      themeColor: doc.themeColor,
      coverImage: doc.coverImage,
      cutoutImage: doc.cutoutImage,
      highlights: doc.highlights,
      isFeatured: doc.isFeatured,
      isActive: doc.isActive,
    }));

    return { success: true, packages };
  } catch (err) {
    return {
      success: false,
      error: toSafeErrorMessage(err, "Unable to fetch tour packages."),
    };
  }
}

export async function upsertPackage(
  rawInput: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (containsMongoOperators(rawInput)) {
      return { success: false, error: "Invalid payload." };
    }

    const parsed = packageUpsertSchema.safeParse(stripMongoOperators(rawInput));
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Invalid tour package details.",
      };
    }

    const { id, ...fields } = parsed.data;
    await connectDB();

    if (id) {
      const existing = await PackageModel.findByIdAndUpdate(
        id,
        { $set: fields },
        { new: true }
      );
      if (!existing) {
        return { success: false, error: "Package not found." };
      }
    } else {
      await PackageModel.create(fields);
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: toSafeErrorMessage(err, "Failed to save tour package."),
    };
  }
}

export async function togglePackageFlag(
  packageId: string,
  field: "isActive" | "isFeatured"
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!/^[a-fA-F0-9]{24}$/.test(packageId)) {
      return { success: false, error: "Invalid package ID." };
    }

    await connectDB();
    const pkg = await PackageModel.findById(packageId);
    if (!pkg) {
      return { success: false, error: "Package not found." };
    }

    pkg[field] = !pkg[field];
    await pkg.save();

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: toSafeErrorMessage(err, "Failed to toggle package flag."),
    };
  }
}

export async function deletePackage(
  packageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!/^[a-fA-F0-9]{24}$/.test(packageId)) {
      return { success: false, error: "Invalid package ID." };
    }

    await connectDB();
    const deleted = await PackageModel.findByIdAndDelete(packageId);
    if (!deleted) {
      return { success: false, error: "Package not found." };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: toSafeErrorMessage(err, "Failed to delete package."),
    };
  }
}
