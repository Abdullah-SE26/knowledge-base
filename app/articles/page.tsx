
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function ArticlesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email?.endsWith("@mawaridhi.com")) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Articles</h1>
      {/* render article list */}
    </div>
  );
}
