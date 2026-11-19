"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Trophy, Users, GitCompare, Sparkles, Activity,
  BarChart3, Shield, Layers, DollarSign, Bookmark,
  Settings, Menu, X, ChevronDown, FlaskConical, History
} from "lucide-react";

const CURRENT_APP_VERSION = "1.3.0";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [hasUnseenRelease, setHasUnseenRelease] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem("epl_seen_version");
      if (seen !== CURRENT_APP_VERSION) {
        setHasUnseenRelease(true);
      }
      if (pathname === "/changelog") {
        window.localStorage.setItem("epl_seen_version", CURRENT_APP_VERSION);
        setHasUnseenRelease(false);
      }
    } catch {
      // Ignore storage restrictions
    }
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { name: "Overview", href: "/", icon: Trophy },
    { name: "Players", href: "/players", icon: Users },
    { name: "Advanced Analytics", href: "/analytics/advanced", icon: Activity },
    { name: "Intelligence Lab", href: "/intelligence-lab", icon: FlaskConical },
    { name: "Comparison", href: "/comparison", icon: GitCompare },
    { name: "Similar Cohorts", href: "/similar-players", icon: Layers },
    { name: "Insights", href: "/insights", icon: Sparkles },
    { name: "Teams", href: "/teams", icon: Shield },
    { name: "Seasons", href: "/seasons", icon: BarChart3 },
    { name: "Auction", href: "/auction", icon: DollarSign },
    { name: "Shortlists", href: "/shortlists", icon: Bookmark },
    { name: "Release Notes", href: "/changelog", icon: History },
    { name: "Admin", href: "/admin", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#07203F] text-[#EBDED4] border-b border-[#D9AA90]/20 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Editorial Title + Version Pill */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded bg-[#A65E46] flex items-center justify-center text-[#EBDED4] font-serif font-bold text-lg shadow">
                E
              </div>
              <div>
                <span className="font-serif text-base font-bold tracking-tight text-[#EBDED4] block leading-none">
                  EPL ANALYTICS
                </span>
                <span className="text-[10px] tracking-widest uppercase text-[#D9AA90] block mt-0.5">
                  Exotica Premier League
                </span>
              </div>
            </Link>

            <Link
              href="/changelog"
              title="View Version 1.1.0 Release Notes & Changelog"
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#02000D]/60 border border-[#D9AA90]/35 text-[10px] font-mono text-[#D9AA90] hover:bg-[#A65E46] hover:text-[#EBDED4] transition-colors"
            >
              <span>v{CURRENT_APP_VERSION}</span>
              {hasUnseenRelease && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-sans font-semibold text-[#EBDED4] bg-[#A65E46] px-1.5 py-0.2 rounded-full"
                  aria-label="New version available"
                >
                  NEW
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-0.5">
            <Link
              href="/"
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive("/") && pathname === "/"
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#02000D]/40"
              }`}
            >
              Overview
            </Link>

            <Link
              href="/players"
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive("/players")
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#02000D]/40"
              }`}
            >
              Players
            </Link>

            {/* Analytics Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center space-x-1 transition-colors ${
                  pathname.startsWith("/analytics") || pathname.startsWith("/similar-players")
                    ? "bg-[#A65E46] text-[#EBDED4]"
                    : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#02000D]/40"
                }`}
              >
                <span>Analytics</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {analyticsOpen && (
                <div
                  className="absolute left-0 mt-1 w-52 bg-[#07203F] border border-[#D9AA90]/30 rounded-lg shadow-xl py-1.5 z-50"
                  onMouseLeave={() => setAnalyticsOpen(false)}
                >
                  <Link
                    href="/analytics/advanced"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs font-semibold text-[#D9AA90] hover:bg-[#A65E46]/30 transition-colors border-b border-[#D9AA90]/15"
                  >
                    Advanced Analytics (v1.1)
                  </Link>
                  <Link
                    href="/analytics/batting"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#EBDED4] hover:bg-[#A65E46]/30 transition-colors"
                  >
                    Batting Leaderboards
                  </Link>
                  <Link
                    href="/analytics/bowling"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#EBDED4] hover:bg-[#A65E46]/30 transition-colors"
                  >
                    Bowling Leaderboards
                  </Link>
                  <Link
                    href="/analytics/all-rounders"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#EBDED4] hover:bg-[#A65E46]/30 transition-colors"
                  >
                    All-Rounder Rankings
                  </Link>
                  <Link
                    href="/similar-players"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs text-[#EBDED4] hover:bg-[#A65E46]/30 transition-colors"
                  >
                    Similar Player Cohorts
                  </Link>
                  <Link
                    href="/analytics/records"
                    onClick={() => setAnalyticsOpen(false)}
                    className="block px-4 py-2 text-xs font-semibold text-[#D9AA90] hover:bg-[#A65E46]/30 transition-colors border-t border-[#D9AA90]/15"
                  >
                    Tournament Records &amp; Milestones (v1.3)
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/intelligence-lab"
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive("/intelligence-lab")
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#D9AA90] hover:text-[#EBDED4] hover:bg-[#02000D]/40"
              }`}
            >
              Intel Lab
            </Link>

            <Link
              href="/comparison"
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive("/comparison")
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#02000D]/40"
              }`}
            >
              Compare
            </Link>

            <Link
              href="/insights"
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive("/insights")
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#02000D]/40"
              }`}
            >
              Insights
            </Link>

            <Link
              href="/teams"
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive("/teams")
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#02000D]/40"
              }`}
            >
              Teams
            </Link>

            <Link
              href="/seasons"
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive("/seasons")
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#02000D]/40"
              }`}
            >
              Seasons
            </Link>

            <Link
              href="/auction"
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive("/auction")
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#02000D]/40"
              }`}
            >
              Auction
            </Link>

            <Link
              href="/shortlists"
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive("/shortlists")
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#EBDED4]/80 hover:text-[#EBDED4] hover:bg-[#02000D]/40"
              }`}
            >
              Shortlists
            </Link>

            <Link
              href="/admin"
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors border border-[#D9AA90]/30 ml-1 ${
                isActive("/admin")
                  ? "bg-[#A65E46] text-[#EBDED4]"
                  : "text-[#D9AA90] hover:bg-[#02000D]/40"
              }`}
              title="Admin Portal"
            >
              <Settings className="w-3.5 h-3.5 inline mr-1" />
              Admin
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/changelog"
              className="px-2 py-0.5 rounded-full bg-[#02000D]/60 border border-[#D9AA90]/35 text-[10px] font-mono text-[#D9AA90]"
            >
              v{CURRENT_APP_VERSION}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#EBDED4] hover:text-[#D9AA90]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#02000D] border-b border-[#D9AA90]/20 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded text-sm ${
                  isActive(link.href)
                    ? "bg-[#A65E46] text-[#EBDED4]"
                    : "text-[#EBDED4]/80 hover:bg-[#07203F]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
