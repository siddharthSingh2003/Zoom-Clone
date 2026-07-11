"use client";
import Link from "next/link";
import { Video, Settings, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { googleLoginUrl } from "@/lib/api";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-card-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zoom-blue text-white">
            <Video size={18} />
          </span>
          <span className="hidden sm:inline">Zoom Clone</span>
        </Link>
        <nav className="flex items-center gap-0.5 text-sm sm:gap-2">
          <Link
            href="/join"
            className="rounded-lg px-2 py-2 text-gray-600 hover:bg-gray-50 hover:text-foreground sm:px-3"
          >
            Join
          </Link>
          <Link
            href="/schedule"
            className="rounded-lg px-2 py-2 text-gray-600 hover:bg-gray-50 hover:text-foreground sm:px-3"
          >
            Schedule
          </Link>

          <div className="mx-0.5 h-6 w-px bg-card-border sm:mx-1" />

          <button
            title="Settings"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-50 hover:text-foreground cursor-pointer"
          >
            <Settings size={18} />
          </button>

          {loading ? (
            <span className="h-9 w-9 shrink-0 rounded-full bg-gray-100" />
          ) : user ? (
            <>
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  title={user.name}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  title={user.name}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zoom-blue text-sm font-semibold text-white"
                >
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <button
                onClick={logout}
                title="Sign out"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-50 hover:text-foreground cursor-pointer"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <a
              href={googleLoginUrl()}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-card-border px-2.5 py-2 text-sm font-medium text-foreground hover:bg-gray-50 sm:px-3"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Sign in</span>
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
