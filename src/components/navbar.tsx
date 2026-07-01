"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  PlusCircle,
  MessageSquare,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Gamepad2,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <div className="relative w-full z-50 px-4 pt-4 pb-4 pointer-events-none">
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 shadow-lg shadow-black/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] dark:shadow-emerald-500/10 rounded-full max-w-7xl mx-auto pointer-events-auto transition-all duration-300 hover:shadow-xl dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] dark:hover:shadow-emerald-500/20">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <span className="text-white font-bold text-sm tracking-wider">LF</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">LOSTFOUND</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/browse"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
              >
                Browse Items
              </Link>
              <Link
                href="/report"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
              >
                Report Item
              </Link>
              <Link
                href="/game"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1.5"
              >
                <Gamepad2 className="w-4 h-4" />
                Play Game
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/messages"
                  className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-900 dark:text-slate-200 font-medium">
                    {user.name}
                  </span>
                  <button
                    onClick={() => logout()}
                    className="text-sm text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-bold bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:bg-gradient-to-b hover:from-emerald-400 hover:to-emerald-500 text-white px-5 py-2.5 rounded-full transition-all transform hover:-translate-y-[1px] active:translate-y-[1px]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center"
            >
              {mobileOpen ? (
                <X className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              ) : (
                <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl mt-2 mx-auto max-w-7xl pointer-events-auto overflow-hidden shadow-xl dark:shadow-emerald-500/10">
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/browse"
              className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Browse Items
            </Link>
            <Link
              href="/report"
              className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
              onClick={() => setMobileOpen(false)}
            >
              Report Item
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/messages"
                  className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  onClick={() => setMobileOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="block py-2 text-sm font-medium text-red-600"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  onClick={() => setMobileOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="block py-2 text-sm font-bold text-emerald-600"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
