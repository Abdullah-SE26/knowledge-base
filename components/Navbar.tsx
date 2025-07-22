import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LogoutButton from "./LogoutButton";
import { LogOut, ChevronDown,UserCog } from "lucide-react";
import ModeToggleWrapper from "./ModeTogglerWrapper";
import LogoSwitcher from "./LogoSwitcher";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  function getDisplayName(email: string | null | undefined): string {
    if (!email) return "";
    const namePart = email.split("@")[0].trim();
    const nameSegments = namePart.split(/[._-]/);
    return nameSegments
      .map(
        (segment) =>
          segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
      )
      .join(" ");
  }

  const displayName = getDisplayName(session?.user?.email);

  return (
    <header className="py-4 bg-white dark:bg-gray-900 shadow">
  <nav
    className="mx-auto max-w-6xl px-6 flex items-center justify-between"
    aria-label="Main navigation"
  >
    {/* Logo */}
    <div className="flex-shrink-0">
      <LogoSwitcher />
    </div>

    {/* Links */}
    <div className="flex gap-6 text-md font-medium text-gray-700 dark:text-gray-200">
      <Link href="/">Home</Link>
      <Link href="/articles">Articles</Link>
      <Link href="#">Help Desk</Link>
      <Link href="https://mawaridhi.com/" target="_blank">
        Visit Mawaridhi
      </Link>
    </div>

    {/* Theme + Auth */}
    <div className="flex gap-3 items-center">
      <ModeToggleWrapper />
      {session?.user ? (
        <details className="relative dropdown">
          <summary className="btn bg-blue-800 text-white rounded-md px-3 py-1 cursor-pointer flex items-center gap-1">
            Welcome, {displayName}
            <ChevronDown size={16} />
          </summary>
        <ul className="absolute right-1 mt-1 p-2 shadow menu dropdown-content rounded-md z-50 w-44 bg-white dark:bg-gray-800 text-sm text-black dark:text-white">
          <li>
            <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-2 w-full rounded-md text-left">
              <LogOut size={16} />
              <LogoutButton />
            </div>
          </li>
          <li>
            <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-2 w-full rounded-md text-left">
              <UserCog size={16} />
              <Link href="/dashboard" className="w-full">
                Admin Dashboard
              </Link>
            </div>
          </li>
        </ul>



        </details>
      ) : (
        <Link
          href="/login"
          className="hover:bg-blue-900 rounded-md py-1 px-3 bg-blue-800 text-white cursor-pointer"
        >
          Login
        </Link>
      )}
    </div>
  </nav>
</header>

  );
}
