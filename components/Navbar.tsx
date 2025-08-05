import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LogoutButton from "./LogoutButton";
import LogoSwitcher from "./LogoSwitcher";
import ModeToggleWrapper from "./ModeTogglerWrapper";
import {
  Home,
  FileTextIcon,
  HeadsetIcon,
  GlobeIcon,
  ChevronDown,
  UserCog,
  LogOut,
} from "lucide-react";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  function getDisplayName(email: string | null | undefined): string {
    if (!email) return "";
    const namePart = email.split("@")[0].trim();
    const nameSegments = namePart.split(/[._-]/);
    return nameSegments
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
      .join(" ");
  }

  const displayName = getDisplayName(session?.user?.email);

  return (
    <div className="navbar bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm px-4">
      {/* Left: Logo + Mobile Menu */}
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-white dark:bg-gray-800 rounded-box w-52 text-gray-900 dark:text-white"
          >
            <li>
              <Link href="/" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400">
                <Home size={16} /> Home
              </Link>
            </li>
            <li>
              <Link href="/articles" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400">
                <FileTextIcon size={16} /> Articles
              </Link>
            </li>
            <li>
              <Link
                href="https://helpdesk.mawaridhi.com/support/home"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <HeadsetIcon size={16} /> Help Desk
              </Link>
            </li>
            <li>
              <Link
                href="https://mawaridhi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <GlobeIcon size={16} /> Visit Mawaridhi
              </Link>
            </li>
          </ul>
        </div>
        <LogoSwitcher />
      </div>

      {/* Center: Nav (desktop only) */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 font-medium text-gray-700 dark:text-gray-200">
          <li>
            <Link href="/" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400">
              <Home size={16} /> Home
            </Link>
          </li>
          <li>
            <Link href="/articles" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400">
              <FileTextIcon size={16} /> Articles
            </Link>
          </li>
          <li>
            <Link
              href="https://helpdesk.mawaridhi.com/support/home"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <HeadsetIcon size={16} /> Help Desk
            </Link>
          </li>
          <li>
            <Link
              href="https://mawaridhi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <GlobeIcon size={16} /> Visit Mawaridhi
            </Link>
          </li>
        </ul>
      </div>

      {/* Right: Theme toggle + User menu */}
      <div className="navbar-end gap-2">
        <ModeToggleWrapper />

        {session?.user ? (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn bg-blue-800 hover:bg-blue-900 text-white gap-2"
            >
              Welcome, {displayName}
              <ChevronDown size={16} />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-box w-56"
            >
              <li>
                <Link href="/admin" className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-2 py-1">
                  <UserCog size={16} /> Admin Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-2 py-1">
                  <LogOut size={16} />
                  <LogoutButton />
                </div>
              </li>
            </ul>
          </div>
        ) : (
          <Link
            href="/login"
            className="btn bg-blue-800 hover:bg-blue-900 text-white"
          >
            Login
          </Link>
        )}
      </div>
    </div>
  );
}
