"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Trophy, Users, GitCompare, Sparkles, Activity,
  BarChart3, Shield, Layers, DollarSign, Bookmark,
  Settings, Menu, X, ChevronDown, FlaskConical, History,
  Award, Sun, Moon, LayoutDashboard
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { EplBrandLogo } from "@/components/EplBrandLogo";

const CURRENT_APP_VERSION = "2.0.1-dev";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [hasUnseenRelease, setHasUnseenRelease] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();

  // Scroll-Responsive Dynamic Behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { name: "Landing", href: "/", icon: Trophy },
    { name: "Terminal", href: "/dashboard", icon: LayoutDashboard },
    { name: "Players", href: "/players", icon: Users },
    { name: "Records", href: "/analytics/records", icon: Award },
    { name: "Advanced", href: "/analytics/advanced", icon: Activity },
    { name: "Intel Lab", href: "/intelligence-lab", icon: FlaskConical },
    { name: "Comparison", href: "/comparison", icon: GitCompare },
    { name: "Cohorts", href: "/similar-players", icon: Layers },
    { name: "Insights", href: "/insights", icon: Sparkles },
    { name: "Teams", href: "/teams", icon: Shield },
    { name: "Seasons", href: "/seasons", icon: BarChart3 },
    { name: "Auction", href: "/auction", icon: DollarSign },
    { name: "Shortlists", href: "/shortlists", icon: Bookmark },
    { name: "Changelog", href: "/changelog", icon: History },
    { name: "Admin", href: "/admin", icon: Settings },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 no-print ${
        isScrolled
          ? "bg-[#FAF7F0]/90 dark:bg-[#111318]/90 backdrop-blur-2xl border-b border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 shadow-md py-0"
          : "bg-[#F1EBDD]/80 dark:bg-[#111318]/80 backdrop-blur-md border-b border-[#DDD5C3]/40 dark:border-[#2A2E38]/50 py-1"
      } text-[#111318] dark:text-[#F1EBDD]`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-14" : "h-16"}`}>
          {/* Brand Logo & Original EPL Insignia */}
          <div className="flex items-center space-x-3.5">
            <Link href="/" className="flex items-center group">
              <EplBrandLogo variant="full" size="md" />
            </Link>

            <Link
              href="/changelog"
              title="View Version 2.0.1-dev Release Notes"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8E1D1]/60 dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-[10px] font-mono text-[#5C584E] dark:text-[#A8A295] hover:text-[#FF4B35] dark:hover:text-[#FF4B35] hover:border-[#FF4B35] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35] animate-pulse" />
              <span>v{CURRENT_APP_VERSION}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                pathname === "/dashboard"
                  ? "bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm font-bold"
                  : "text-[#5C584E] dark:text-[#A8A295] hover:text-[#111318] dark:hover:text-[#F1EBDD] hover:bg-[#E8E1D1]/40 dark:hover:bg-[#181A20]/60"
              }`}
            >
              {pathname === "/dashboard" && <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35]" />}
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Terminal</span>
            </Link>

            <Link
              href="/players"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive("/players")
                  ? "bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm font-bold"
                  : "text-[#5C584E] dark:text-[#A8A295] hover:text-[#111318] dark:hover:text-[#F1EBDD] hover:bg-[#E8E1D1]/40 dark:hover:bg-[#181A20]/60"
              }`}
            >
              {isActive("/players") && <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35]" />}
              <Users className="w-3.5 h-3.5" />
              <span>Athletes</span>
            </Link>

            {/* Analytics Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center space-x-1 ${
                  pathname.startsWith("/analytics")
                    ? "bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm font-bold"
                    : "text-[#5C584E] dark:text-[#A8A295] hover:text-[#111318] dark:hover:text-[#F1EBDD] hover:bg-[#E8E1D1]/40 dark:hover:bg-[#181A20]/60"
                }`}
              >
                {pathname.startsWith("/analytics") && <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35]" />}
                <span>Analytics</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {analyticsOpen && (
                <div
                  className="absolute left-0 mt-2 w-56 rounded-2xl bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setAnalyticsOpen(false)}
                >
                  <Link
                    href="/analytics/records"
                    onClick={() => setAnalyticsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#111318] dark:text-[#F1EBDD] hover:bg-[#E8E1D1]/60 dark:hover:bg-[#22252D] hover:text-[#FF4B35] dark:hover:text-[#FF4B35]"
                  >
                    <Award className="w-4 h-4 text-[#FF4B35]" />
                    <span>Tournament Records</span>
                  </Link>
                  <Link
                    href="/analytics/batting"
                    onClick={() => setAnalyticsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#111318] dark:text-[#F1EBDD] hover:bg-[#E8E1D1]/60 dark:hover:bg-[#22252D] hover:text-[#FF4B35] dark:hover:text-[#FF4B35]"
                  >
                    <Trophy className="w-4 h-4 text-[#FF4B35]" />
                    <span>Batting Analytics</span>
                  </Link>
                  <Link
                    href="/analytics/bowling"
                    onClick={() => setAnalyticsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#111318] dark:text-[#F1EBDD] hover:bg-[#E8E1D1]/60 dark:hover:bg-[#22252D] hover:text-[#FF4B35] dark:hover:text-[#FF4B35]"
                  >
                    <Shield className="w-4 h-4 text-[#FF4B35]" />
                    <span>Bowling Analytics</span>
                  </Link>
                  <Link
                    href="/analytics/all-rounders"
                    onClick={() => setAnalyticsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#111318] dark:text-[#F1EBDD] hover:bg-[#E8E1D1]/60 dark:hover:bg-[#22252D] hover:text-[#FF4B35] dark:hover:text-[#FF4B35]"
                  >
                    <Activity className="w-4 h-4 text-[#FF4B35]" />
                    <span>All-Rounder Index</span>
                  </Link>
                  <Link
                    href="/analytics/advanced"
                    onClick={() => setAnalyticsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#111318] dark:text-[#F1EBDD] hover:bg-[#E8E1D1]/60 dark:hover:bg-[#22252D] hover:text-[#FF4B35] dark:hover:text-[#FF4B35]"
                  >
                    <Activity className="w-4 h-4 text-[#FF4B35]" />
                    <span>Advanced Suite (6-in-1)</span>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/intelligence-lab"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive("/intelligence-lab")
                  ? "bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm font-bold"
                  : "text-[#5C584E] dark:text-[#A8A295] hover:text-[#111318] dark:hover:text-[#F1EBDD] hover:bg-[#E8E1D1]/40 dark:hover:bg-[#181A20]/60"
              }`}
            >
              {isActive("/intelligence-lab") && <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35]" />}
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Intel Lab</span>
            </Link>

            <Link
              href="/comparison"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive("/comparison")
                  ? "bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm font-bold"
                  : "text-[#5C584E] dark:text-[#A8A295] hover:text-[#111318] dark:hover:text-[#F1EBDD] hover:bg-[#E8E1D1]/40 dark:hover:bg-[#181A20]/60"
              }`}
            >
              {isActive("/comparison") && <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35]" />}
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare</span>
            </Link>

            <Link
              href="/teams"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive("/teams")
                  ? "bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm font-bold"
                  : "text-[#5C584E] dark:text-[#A8A295] hover:text-[#111318] dark:hover:text-[#F1EBDD] hover:bg-[#E8E1D1]/40 dark:hover:bg-[#181A20]/60"
              }`}
            >
              {isActive("/teams") && <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35]" />}
              <Shield className="w-3.5 h-3.5" />
              <span>Teams</span>
            </Link>

            {/* Prominent Live Auction Action */}
            <Link
              href="/auction"
              className="ml-1 px-4 py-1.5 rounded-xl text-xs font-display font-bold transition-all flex items-center gap-1.5 bg-[#FF4B35] hover:bg-[#E03E29] text-white shadow-md shadow-[#FF4B35]/20 hover:scale-[1.02]"
            >
              <DollarSign className="w-3.5 h-3.5 text-white/90" />
              <span>Live Auction</span>
            </Link>
          </nav>

          {/* Right Controls: Sun/Moon Theme Toggle + Mobile Menu Trigger */}
          <div className="flex items-center space-x-2">
            {/* Signature Page-Curl Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (Page Curl)`}
              className="relative p-2 rounded-xl bg-[#E8E1D1]/60 dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-[#111318] dark:text-[#F1EBDD] hover:text-[#FF4B35] dark:hover:text-[#FF4B35] hover:border-[#FF4B35] dark:hover:border-[#FF4B35] transition-all shadow-sm group"
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-[#FF4B35] group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#E8E1D1]/60 dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-[#111318] dark:text-[#F1EBDD] hover:text-[#FF4B35]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DDD5C3] dark:border-[#2A2E38] bg-[#FAF7F0] dark:bg-[#111318] px-4 pt-3 pb-6 space-y-1.5 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? "bg-[#FF4B35] text-white shadow-sm font-bold"
                      : "text-[#5C584E] dark:text-[#A8A295] hover:bg-[#E8E1D1]/60 dark:hover:bg-[#181A20] hover:text-[#111318] dark:hover:text-[#F1EBDD]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
