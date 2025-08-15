// app/api/users/track-active/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/clientPromise";

export const runtime = "nodejs"; // ensure Node.js runtime, not edge

export async function POST(req: Request) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Not signed in" }),
        { status: 401 }
      );
    }

    const email = session.user.email.toLowerCase();
    const now = new Date();

    // Update lastActive in MongoDB
    const client = await clientPromise;
    const db = client.db("it-kb-cluster");
    await db.collection("users").updateOne(
      { email },
      { $set: { lastActive: now } }
    );

    return new Response(
      JSON.stringify({ ok: true, lastActive: now.toISOString() }),
      { status: 200 }
    );
  } catch (err) {
    console.error("[track-active] Error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Server error" }),
      { status: 500 }
    );
  }
}
