import { NavBar } from '@/components/NavBar'

// This layout wraps all authenticated pages (quests, rewards, dashboard).
// The (authenticated) folder name is a Next.js route group — it doesn't appear in URLs.
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
