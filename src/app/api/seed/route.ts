import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { PackageModel } from "@/models/Package";
import { SEED_PACKAGES } from "@/lib/seedData";
import { toSafeErrorMessage } from "@/lib/security";

function safeSecretMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const { SEED_SECRET } = getServerEnv();
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!token || !safeSecretMatch(token, SEED_SECRET)) {
      return NextResponse.json(
        { error: "Unauthorized seed request." },
        { status: 401 }
      );
    }

    await connectDB();

    let inserted = 0;
    let updated = 0;

    for (const pkg of SEED_PACKAGES) {
      const existing = await PackageModel.findOne({ slug: pkg.slug }).lean();
      if (existing) {
        await PackageModel.updateOne({ slug: pkg.slug }, { $set: pkg });
        updated += 1;
      } else {
        await PackageModel.create(pkg);
        inserted += 1;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Serendib Escapes packages seeded successfully.",
        inserted,
        updated,
        total: SEED_PACKAGES.length,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: toSafeErrorMessage(err, "Failed to seed database.") },
      { status: 500 }
    );
  }
}
