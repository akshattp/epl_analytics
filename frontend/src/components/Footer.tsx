import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#02000D] text-[#EBDED4]/70 border-t border-[#07203F] mt-16 py-12 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-[#A65E46] flex items-center justify-center text-[#EBDED4] font-serif font-bold text-sm">
                E
              </div>
              <span className="font-serif text-base font-bold text-[#EBDED4]">
                EPL ANALYTICS
              </span>
              <Link
                href="/changelog"
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#07203F] text-[#D9AA90] border border-[#D9AA90]/30 hover:bg-[#A65E46] hover:text-[#EBDED4] transition"
              >
                v1.1.0
              </Link>
            </div>
            <p className="text-xs text-[#EBDED4]/60 leading-relaxed">
              Exotica Premier League — Historical Cricket Intelligence, Player Auction Intelligence & Tournament Auction Management Platform.
            </p>
            <p className="text-[11px] text-[#D9AA90]">
              Built with mathematical rigor, explainable insights & local-first architecture.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[#EBDED4] mb-3">Cricket Intelligence</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/analytics/advanced" className="hover:text-[#D9AA90]">Advanced Analytics (Partnerships & Fielding)</Link></li>
              <li><Link href="/intelligence-lab" className="hover:text-[#D9AA90]">EPL Intelligence Lab</Link></li>
              <li><Link href="/analytics/batting" className="hover:text-[#D9AA90]">Batting & Bowling Leaderboards</Link></li>
              <li><Link href="/similar-players" className="hover:text-[#D9AA90]">Similar Player Cohorts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[#EBDED4] mb-3">Auction & Teams</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/auction" className="hover:text-[#D9AA90]">Auction Setup & Live Bidding</Link></li>
              <li><Link href="/shortlists" className="hover:text-[#D9AA90]">Squad Builder & Watchlist</Link></li>
              <li><Link href="/teams" className="hover:text-[#D9AA90]">Franchise Analytics</Link></li>
              <li><Link href="/seasons" className="hover:text-[#D9AA90]">Season Comparison</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[#EBDED4] mb-3">Governance & Releases</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/changelog" className="hover:text-[#D9AA90]">What&apos;s New & Release Notes (v1.1.0)</Link></li>
              <li><Link href="/admin" className="hover:text-[#D9AA90]">Data Quality & Audits</Link></li>
              <li><Link href="/insights" className="hover:text-[#D9AA90]">Explainable AI Insights</Link></li>
              <li className="text-[11px] text-[#EBDED4]/40 pt-2">Five-colour brand identity verified</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#07203F] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#EBDED4]/50">
          <p>© {new Date().getFullYear()} Exotica Premier League (EPL). All historical scorecard data verified.</p>
          <p className="mt-2 sm:mt-0">Tournament: Underarm 6-Over Cricket | Samarpan Exotica, Borivali</p>
        </div>
      </div>
    </footer>
  );
}
