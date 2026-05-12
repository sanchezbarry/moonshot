'use client'

import { useState } from 'react'
import { GalleryVerticalEnd, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/quests', label: 'Quests' },
  { href: '/rewards', label: 'Rewards' },
]

export function NavBar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="w-full border-b bg-background sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
          onClick={() => setOpen(false)}
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          moonshot
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-muted',
                pathname === link.href ? 'bg-muted text-foreground' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
          <form action={logout}>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Logout
            </button>
          </form>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t bg-background px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {link.label}
            </Link>
          ))}
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Logout
            </button>
          </form>
        </nav>
      )}
    </header>
  )
}
