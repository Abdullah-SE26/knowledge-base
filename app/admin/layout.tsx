"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, FileText, ShieldUser } from "lucide-react";
import { useSession } from "next-auth/react";
import * as Tooltip from "@radix-ui/react-tooltip";

const baseNavItems = [
  { href: "/admin", icon: Grid, label: "Dashboard" },
  { href: "/admin/articles", icon: FileText, label: "Articles" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = React.useMemo(() => {
    if (session?.user?.role === "superadmin") {
      return [
        { href: "/", icon: Home, label: "Home" },
        ...baseNavItems,
        { href: "/admin/superadmin", icon: ShieldUser, label: "Super Admin" },
      ];
    }
    return [
      { href: "/", icon: Home, label: "Home" },
      ...baseNavItems,
    ];
  }, [session?.user?.role]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="flex flex-col items-center w-20 bg-gradient-to-b from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg py-6 space-y-6">
        <Tooltip.Provider>
          {/* Navigation */}
          <nav className="flex flex-col items-center space-y-4 mt-2">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Tooltip.Root key={href}>
                  <Tooltip.Trigger asChild>
                    <Link
                      href={href}
                      aria-label={label}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200
                        ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 dark:hover:bg-blue-600 hover:text-white"
                        }
                      `}
                    >
                      <Icon className="w-6 h-6" />
                    </Link>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={6}
                      className="z-50 rounded bg-black px-2 py-1 text-xs text-white shadow-md"
                    >
                      {label}
                      <Tooltip.Arrow className="fill-black" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            })}
          </nav>
        </Tooltip.Provider>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900 rounded-tl-2xl transition-colors">
        {children}
      </main>
    </div>
  );
}
