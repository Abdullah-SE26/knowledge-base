import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin(req, { requireSuperadmin: true });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectMongoDB();

  try {
    const { id } = params;
    const { role } = await req.json();

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const allowedRoles = ["user", "admin", "superadmin"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Role updated successfully", user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
