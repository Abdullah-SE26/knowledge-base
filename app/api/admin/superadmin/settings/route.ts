import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb"; // Your MongoDB connection helper
import Settings from "@/models/Settings"; // Your Settings mongoose model
import { requireAdmin } from "@/lib/adminAuth"; // Middleware/auth helper to restrict access

export async function GET(req: Request) {
  await connectMongoDB();

  // Only allow superadmins or admins
  const session = await requireAdmin(req);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await Settings.findOne({});
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

  const session = await requireAdmin(req, { requireSuperadmin: true });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { allowedDomains, exceptionEmails } = body;

    if (!Array.isArray(allowedDomains) || !Array.isArray(exceptionEmails)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Upsert settings document
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
