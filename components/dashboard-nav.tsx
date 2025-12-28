"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ListPlus, Settings, ShoppingBag, Menu, X } from "lucide-react"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { title: "New Sale", href: "/dashboard/new-sale", icon: ListPlus },
  { title: "Sales Records", href: "/dashboard/sales", icon: ShoppingBag },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <nav className="bg-white border-b border-gray-200 p-4 w-full">
      {/* Mobile header */}
      <div className="flex items-center justify-between sm:hidden">
        <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
        <button
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {/* Swapping icon for better UX */}
          {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
        </button>
      </div>

      {/* Nav items */}
      <ul
        id="dashboard-nav-items"
        className={`
          /* Mobile styles: Full width, vertical stack */
          ${isOpen ? "flex" : "hidden"} 
          flex-col mt-4 space-y-1 w-full
          
          /* Desktop styles: Reset to horizontal */
          sm:flex sm:flex-row sm:mt-0 sm:space-y-0 sm:space-x-4 sm:w-auto
        `}
      >
        {navItems.map(({ title, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <li key={href} className="w-full sm:w-auto">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`
                  flex items-center gap-3 px-4 py-3 sm:py-2 sm:px-3 rounded-md text-sm font-medium transition-colors w-full
                  ${isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
