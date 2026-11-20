import { connectDB } from "@/lib/db";
import { SEED_PACKAGES } from "@/lib/seedData";
import { PackageModel } from "@/models/Package";
import { TourPackageDTO } from "@/types";

export async function getPublicPackages(): Promise<{
  packages: TourPackageDTO[];
  source: "mongodb" | "fallback";
}> {
  if (!process.env.MONGODB_URI) {
    return {
      packages: SEED_PACKAGES.map((pkg, idx) => ({
        ...pkg,
        id: `demo-pkg-${idx + 1}`,
      })),
      source: "fallback",
    };
  }

  try {
    await connectDB();
    const docs = await PackageModel.find({ isActive: true })
      .sort({ isFeatured: -1, priceUsd: 1 })
      .lean();

    if (docs.length === 0) {
      return {
        packages: SEED_PACKAGES.map((pkg, idx) => ({
          ...pkg,
          id: `demo-pkg-${idx + 1}`,
        })),
        source: "fallback",
      };
    }

    return {
      packages: docs.map((doc) => ({
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
      })),
      source: "mongodb",
    };
  } catch {
    return {
      packages: SEED_PACKAGES.map((pkg, idx) => ({
        ...pkg,
        id: `demo-pkg-${idx + 1}`,
      })),
      source: "fallback",
    };
  }
}
