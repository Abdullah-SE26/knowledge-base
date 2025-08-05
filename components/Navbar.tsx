import {
  Navbar,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LogoutButton from "./LogoutButton";
import {
  LogOut,
  ChevronDown,
  UserCog,
  Home,
  FileTextIcon,
  HeadsetIcon,
  GlobeIcon,
} from "lucide-react";
import ModeToggleWrapper from "./ModeTogglerWrapper";
import LogoSwitcher from "./LogoSwitcher";
import Link from "next/link";

export default async function navbar() {
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
      <Navbar
        fluid
        rounded
        className="mx-auto max-w-6xl px-6"
        aria-label="Main navigation"
      >
        {/* Left: Logo + Toggle */}
        <div className="flex items-center gap-4">
          <LogoSwitcher />
          <NavbarToggle />
        </div>

        {/* Center: Nav Links */}
        <NavbarCollapse>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center text-md font-medium text-gray-700 dark:text-gray-200">
            <NavbarLink href="/" title="Home" className="flex items-center gap-2">
              <Home className="w-5 h-5 md:hidden" />
              <span>Home</span>
            </NavbarLink>

            <NavbarLink href="/articles" title="All Articles" className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 md:hidden" />
              <span>Articles</span>
            </NavbarLink>

            <NavbarLink href="https://helpdesk.mawaridhi.com/support/home"  target="_blank"
            rel="noopener noreferrer" title="Visit IT-Help Desk" className="flex items-center gap-2">
              <HeadsetIcon className="w-5 h-5 md:hidden" />
              <span>Help Desk</span>
            </NavbarLink>

            <NavbarLink
              href="https://mawaridhi.com"
              target="_blank"
              title="Visit mawaridhi.com"
              className="flex items-center gap-2"
            >
              <GlobeIcon className="w-5 h-5 md:hidden" />
              <span>Visit Mawaridhi</span>
            </NavbarLink>
          </div>
        </NavbarCollapse>

        {/* Right: Theme Toggle + Auth */}
        <div className="flex items-center gap-4 ">
          <ModeToggleWrapper />
          {session?.user ? (
            <details className="relative dropdown">
              <summary className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-md cursor-pointer appearance-none list-none [&::-webkit-details-marker]:hidden">
                Welcome, {displayName}
                <ChevronDown size={16} />
              </summary>
              <ul className="absolute right-0 mt-2 p-2 shadow rounded-md z-50 w-44 bg-white dark:bg-gray-800 text-sm text-black dark:text-white">
                <li>
                  <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-2 rounded-md text-left">
                    <LogOut size={16} />
                    <LogoutButton />
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-2 rounded-md text-left">
                    <UserCog size={16} />
                    <Link href="/admin" className="w-full">
                      Admin Dashboard
                    </Link>
                  </div>
                </li>
              </ul>
            </details>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 transition"
            >
              Login
            </Link>
          )}
        </div>
      </Navbar>
    </header>
  );
}