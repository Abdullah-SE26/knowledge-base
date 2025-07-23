
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Article from "@/models/Article";
import connectToDB from "@/lib/mongodb"; 

export default async function ArticlesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email?.endsWith("@gmail.com")) {  //later .endsWith("@mawaridhi.com"))
    redirect("/login");
  }

 await connectToDB();
  const articles = await Article.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Articles</h1>
      <ul>
        {articles.map((article) => (
          <li key={article._id}>
            <h2 className="text-xl font-bold">{article.title}</h2>
            <p className="text-gray-700">{article.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}