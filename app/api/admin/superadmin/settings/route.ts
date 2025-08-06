import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  await connectMongoDB();

  // Allow admin or superadmin to fetch settings
  const session = await requireAdmin(req);
  if (!session) 
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await Settings.findOne({});
    // Return settings or default empty arrays
    return NextResponse.json(
      settings || { allowedDomains: [], exceptionEmails: [] }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  await connectMongoDB();

  // Only superadmin allowed to update settings
  const session = await requireAdmin(req, { requireSuperadmin: true });
  if (!session) 
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { allowedDomains, exceptionEmails } = await req.json();

    // Validate input is arrays
    if (!Array.isArray(allowedDomains) || !Array.isArray(exceptionEmails)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Update or create settings document
    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      { allowedDomains, exceptionEmails },
      { new: true, upsert: true }
    );

    return NextResponse.json(updatedSettings);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
