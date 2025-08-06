import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  await connectMongoDB();

  try {
    const settings = await Settings.findOne({});
    return NextResponse.json({
      allowedDomains: settings?.allowedDomains || [],
      exceptionEmails: settings?.exceptionEmails || [],
    });
  } catch (error) {
    return NextResponse.json(
      { allowedDomains: [], exceptionEmails: [] },
      { status: 500 }
    );
  }
}
