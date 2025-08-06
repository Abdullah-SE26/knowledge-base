import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb"; // Your Mongoose connection helper
import User from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectMongoDB();

  try {
    const users = await User.find({}, "email role").lean();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await requireAdmin(req, { requireSuperadmin: true });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectMongoDB();

  try {
    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
      return NextResponse.json({ error: "Missing userId or newRole" }, { status: 400 });
    }

    const allowedRoles = ["user", "admin", "superadmin"];
    if (!allowedRoles.includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
