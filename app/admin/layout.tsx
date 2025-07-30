"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, FileText, Settings } from "lucide-react"; // Grid for dashboard

const navItems = [
  { href: "/admin", icon: Grid, label: "Dashboard" },         // Dashboard icon
  { href: "/admin/articles", icon: FileText, label: "Articles" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="flex flex-col items-center w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg py-6">
        {/* Big Top Icon linking to main Home page */}
        <div className="mb-10">
          <Link href="/" aria-label="Home page">
            <Home className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col space-y-6">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-center w-10 h-10 rounded-lg
                transition-colors duration-200
                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                title={label}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
