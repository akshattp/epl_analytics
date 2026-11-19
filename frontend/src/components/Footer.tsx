import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#02000D] text-[#EBDED4]/75 border-t border-[#D9AA90]/20 mt-16 py-12 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-[#A65E46] flex items-center justify-center text-[#EBDED4] font-serif font-bold text-sm shadow">
                E
              </div>
              <span className="font-serif text-base font-bold text-[#EBDED4]">
                EPL ANALYTICS
              </span>
              <Link
                href="/changelog"
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#07203F] text-[#D9AA90] border border-[#D9AA90]/35 hover:bg-[#A65E46] hover:text-[#EBDED4] transition"
              >
                v1.3.0
              </Link>
            </div>
            <p className="text-xs text-[#EBDED4]/70 leading-relaxed">
              Exotica Premier League — Historical Cricket Intelligence, Advanced Situational Analytics & Six-Franchise Live Auction Platform.
            </p>
            <p className="text-[11px] text-[#D9AA90]/90">
              Zero-fabrication mathematical rigor, explainable insights & local-first architecture.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[#EBDED4] mb-3">Cricket Intelligence</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/analytics/records" className="text-[#D9AA90] hover:text-[#EBDED4] font-semibold">Tournament Records &amp; Milestones (v1.3)</Link></li>
              <li><Link href="/analytics/advanced" className="hover:text-[#D9AA90] transition-colors">Advanced Analytics (Partnerships &amp; Fielding)</Link></li>
              <li><Link href="/intelligence-lab" className="hover:text-[#D9AA90] transition-colors">EPL Intelligence Lab</Link></li>
              <li><Link href="/analytics/batting" className="hover:text-[#D9AA90] transition-colors">Batting &amp; Bowling Leaderboards</Link></li>
              <li><Link href="/similar-players" className="hover:text-[#D9AA90] transition-colors">Similar Player Cohorts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[#EBDED4] mb-3">Auction &amp; Teams</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/auction" className="hover:text-[#D9AA90] transition-colors">Auction Setup &amp; Live Bidding</Link></li>
              <li><Link href="/shortlists" className="hover:text-[#D9AA90] transition-colors">Squad Builder &amp; Watchlist</Link></li>
              <li><Link href="/teams" className="hover:text-[#D9AA90] transition-colors">Franchise Analytics</Link></li>
              <li><Link href="/seasons" className="hover:text-[#D9AA90] transition-colors">Season Comparison</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[#EBDED4] mb-3">Governance &amp; Releases</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/changelog" className="hover:text-[#D9AA90] transition-colors">What&apos;s New &amp; Release Notes (v1.3.0)</Link></li>
              <li><Link href="/admin" className="hover:text-[#D9AA90] transition-colors">Data Quality &amp; Audits</Link></li>
              <li><Link href="/insights" className="hover:text-[#D9AA90] transition-colors">Explainable AI Insights</Link></li>
              <li className="text-[11px] text-[#D9AA90]/60 pt-2">Official Five-Colour Brand Palette: Midnight, Navy, Beige, Peach, Terracotta</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#D9AA90]/15 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#EBDED4]/60 gap-3">
          <p>© 2023–2026 Exotica Premier League (EPL). All historical match scorecards verified.</p>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[10px] text-[#D9AA90]">27 Matches • 56 Innings • 73 Players</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
