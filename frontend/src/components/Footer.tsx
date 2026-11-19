import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#0B1120] text-[#64748B] dark:text-[#94A3B8] border-t border-[#E2E8F0] dark:border-[#334155] mt-16 py-12 no-print transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#0891B2] dark:from-[#3B82F6] dark:to-[#22D3EE] flex items-center justify-center text-white font-display font-bold text-sm shadow-sm">
                E
              </div>
              <span className="font-display text-base font-bold text-[#101828] dark:text-[#F8FAFC]">
                EPL INTELLIGENCE
              </span>
              <Link
                href="/changelog"
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#38BDF8] border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#2563EB] hover:text-white transition"
              >
                v1.3.0
              </Link>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Exotica Premier League — Historical Cricket Intelligence, Advanced Situational Analytics &amp; Six-Franchise Live Auction Platform.
            </p>
            <p className="text-[11px] text-[#2563EB] dark:text-[#38BDF8] font-medium">
              Zero-fabrication mathematical rigor, explainable insights &amp; local-first architecture.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-[#101828] dark:text-[#F8FAFC] mb-3">Cricket Intelligence</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/analytics/records" className="text-[#2563EB] dark:text-[#38BDF8] hover:underline font-semibold">Tournament Records &amp; Milestones</Link></li>
              <li><Link href="/analytics/advanced" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">Advanced Analytics (Partnerships &amp; Fielding)</Link></li>
              <li><Link href="/intelligence-lab" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">EPL Intelligence Lab</Link></li>
              <li><Link href="/analytics/batting" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">Batting &amp; Bowling Leaderboards</Link></li>
              <li><Link href="/similar-players" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">Similar Player Cohorts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-[#101828] dark:text-[#F8FAFC] mb-3">Auction &amp; Teams</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/auction" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">Auction Setup &amp; Live Bidding</Link></li>
              <li><Link href="/shortlists" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">Squad Builder &amp; Watchlist</Link></li>
              <li><Link href="/teams" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">Franchise Analytics</Link></li>
              <li><Link href="/seasons" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">Season Comparison</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-[#101828] dark:text-[#F8FAFC] mb-3">Governance &amp; Releases</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/changelog" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">What&apos;s New &amp; Release Notes (v1.3.0)</Link></li>
              <li><Link href="/admin" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">Data Quality &amp; Audits</Link></li>
              <li><Link href="/insights" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">Explainable AI Insights</Link></li>
              <li className="text-[11px] text-[#64748B] dark:text-[#94A3B8]/80 pt-2">Modern Sports Analytics: Midnight Navy, Electric Blue &amp; Vibrant Cyan</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E2E8F0] dark:border-[#334155] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8] gap-3">
          <p>© 2023–2026 Exotica Premier League (EPL). All historical match scorecards verified.</p>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[10px] text-[#2563EB] dark:text-[#38BDF8]">27 Matches • 56 Innings • 73 Players</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
