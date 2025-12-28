"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ListPlus, Settings, ShoppingBag, Menu } from "lucide-react";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { title: "New Sale", href: "/dashboard/new-sale", icon: ListPlus },
  { title: "Sales Records", href: "/dashboard/sales", icon: ShoppingBag },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white border-b border-gray-200 p-4">
      {/* Hamburger button - visible only on mobile */}
      <div className="flex items-center justify-between sm:hidden">
        <h2 className="text-lg font-semibold">Menu</h2>
        <button
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          aria-controls="dashboard-nav-items"
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* Nav items container */}
      <ul
        id="dashboard-nav-items"
        className={`mt-4 flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0 ${
          isOpen ? "block" : "hidden"
        } sm:block`}
      >
        {navItems.map(({ title, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                }`}
                onClick={() => setIsOpen(false)} // close menu on mobile after click
              >
                <Icon className="h-5 w-5" />
                {title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
