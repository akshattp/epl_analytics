import Link from "next/link";
import { EplBrandLogo } from "./EplBrandLogo";

export default function Footer() {
  return (
    <footer className="bg-[#FAF7F0] dark:bg-[#181A20] text-[#71717A] dark:text-[#A1A1AA] border-t border-[#DDD5C3]/60 dark:border-[#2A2E38] mt-16 py-12 no-print transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <EplBrandLogo variant="icon" size="sm" />
              <span className="font-display text-base font-bold text-[#111318] dark:text-[#F1EBDD] tracking-tight">
                EPL INTELLIGENCE
              </span>
              <Link
                href="/changelog"
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8E1D1]/60 dark:bg-[#22252D] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38] hover:border-[#FF4B35] transition"
              >
                v2.0.1-dev
              </Link>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              Exotica Premier League — Historical Cricket Intelligence, Advanced Situational Analytics &amp; Six-Franchise Live Auction Platform.
            </p>
            <p className="text-[11px] text-[#FF4B35] font-medium">
              Zero-fabrication mathematical rigor, explainable insights &amp; local-first architecture.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-[#111318] dark:text-[#F1EBDD] mb-3">Cricket Intelligence</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/analytics/records" className="text-[#FF4B35] hover:underline font-semibold">Tournament Records &amp; Milestones</Link></li>
              <li><Link href="/analytics/advanced" className="hover:text-[#FF4B35] transition-colors">Advanced Analytics (Partnerships &amp; Fielding)</Link></li>
              <li><Link href="/intelligence-lab" className="hover:text-[#FF4B35] transition-colors">EPL Intelligence Lab</Link></li>
              <li><Link href="/analytics/batting" className="hover:text-[#FF4B35] transition-colors">Batting &amp; Bowling Leaderboards</Link></li>
              <li><Link href="/similar-players" className="hover:text-[#FF4B35] transition-colors">Similar Player Cohorts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-[#111318] dark:text-[#F1EBDD] mb-3">Auction &amp; Teams</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/auction" className="hover:text-[#FF4B35] transition-colors">Auction Setup &amp; Live Bidding</Link></li>
              <li><Link href="/shortlists" className="hover:text-[#FF4B35] transition-colors">Squad Builder &amp; Watchlist</Link></li>
              <li><Link href="/teams" className="hover:text-[#FF4B35] transition-colors">Franchise Analytics</Link></li>
              <li><Link href="/seasons" className="hover:text-[#FF4B35] transition-colors">Season Comparison</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-[#111318] dark:text-[#F1EBDD] mb-3">Governance &amp; Releases</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/changelog" className="hover:text-[#FF4B35] transition-colors">What&apos;s New &amp; Release Notes (v2.0.1-dev)</Link></li>
              <li><Link href="/admin" className="hover:text-[#FF4B35] transition-colors">Data Quality &amp; Audits</Link></li>
              <li><Link href="/insights" className="hover:text-[#FF4B35] transition-colors">Explainable AI Insights</Link></li>
              <li className="text-[11px] text-[#888888] pt-2">Luxury Editorial Analytics: Obsidian, Warm Ivory &amp; Electric Vermilion</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#DDD5C3]/40 dark:border-[#2A2E38] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#71717A] dark:text-[#A1A1AA] gap-3">
          <p>© 2023–2026 Exotica Premier League (EPL). All historical match scorecards verified.</p>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[10px] text-[#FF4B35]">27 Matches • 56 Innings • 73 Players</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
