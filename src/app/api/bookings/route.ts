import { NextRequest, NextResponse } from "next/server";
import { processBookingSubmission } from "@/actions/bookingActions";
import { containsMongoOperators, toSafeErrorMessage } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (containsMongoOperators(body)) {
      return NextResponse.json(
        { success: false, error: "Malicious payload rejected." },
        { status: 400 }
      );
    }

    const result = await processBookingSubmission(body);
    if (!result.success) {
      const status = result.error?.includes("Too many") ? 429 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: toSafeErrorMessage(err, "Invalid JSON request body."),
      },
      { status: 400 }
    );
  }
}
