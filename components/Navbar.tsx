import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LogoutButton from "./LogoutButton";
import { LogOut, Moon, Sun } from "lucide-react";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

//   getiing the first and second name of the user and displaying them in welcome message
  function getDisplayName(email: string | null | undefined): string {
  if (!email) return "";

  const namePart = email.split("@")[0].trim(); 
  const nameSegments = namePart.split(/[._-]/); 

  const capitalized = nameSegments
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");

  return capitalized;
}

const displayName = getDisplayName(session?.user?.email);


  return (
    <header className="py-2 bg-white shadow">
      <nav
        className="mx-auto max-w-4xl flex items-center justify-between "
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div>
          <Link href="/">
            <Image
              src="/favicon.ico"
              alt="Mawaridhi Logo"
              width={150}
              height={60}
              className="mix-blend-multiply"
            />
          </Link>
        </div>

        {/* Center nav links */}
        <div className="flex gap-6 text-md font-medium text-gray-700">
          <Link href="/">Home</Link>
          <Link href="/articles" title="View all articles">Articles</Link>
          <Link href="#" target="_blank" title="Visit IT support to create a ticket">Help Desk</Link>
          <Link href="https://mawaridhi.com/" target="_blank" title="Visit mawaridhi.com">Visit Mawaridhi</Link>
        </div>

        {/* Auth Menu */}
        <div>
          {session?.user ? (
            <details className="relative dropdown">
              <summary className="btn bg-blue-800 text-white rounded-md px-3 py-1 cursor-pointer">
                Welcome, {displayName}
              </summary>
                    <ul className="absolute right-1 mt-1 p-2 shadow menu dropdown-content rounded-md z-50 w-44 bg-white text-sm text-black">
                    <li>
                        <div className="flex items-center gap-2 hover:bg-gray-100 px-2 py-2 w-full rounded-md text-left">
                        <LogOut size={16} />
                        <LogoutButton />
                        </div>
                    </li>
                    <li>
                        <button className="flex items-center gap-2 hover:bg-gray-100 px-2 py-2 w-full rounded-md text-left">
                        <Moon size={16} />
                        Dark Mode
                        </button>
                    </li>
                    <li>
                        <button className="flex items-center gap-2 hover:bg-gray-100 px-2 py-2 w-full rounded-md text-left">
                        <Sun size={16} />
                        Light Mode
                        </button>
                    </li>
                    </ul>


            </details>
          ) : (
            <Link
              href="/login"
              className="hover:bg-blue-900 border-2 rounded-md py-1 px-3 bg-blue-800 text-white cursor-pointer"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
