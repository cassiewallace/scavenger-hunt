import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LeaderboardList from '../components/LeaderboardList'

/**
 * Landing — main hub page.
 *
 * Layout:
 *   1. Brand hero image (Venture Out logo)
 *   2. Two CTAs: "Submit a Find" · "Add a Team"
 *   3. Live leaderboard (inline, realtime)
 *
 * Accessibility:
 *   - All interactive elements meet WCAG 2.5.5 minimum tap target (48px)
 *   - Button contrast ratios: Submit 5.3:1 (AA), Add Team 9.4:1 (AAA)
 *   - Live region on leaderboard section
 */
export default function Landing() {
  const navigate = useNavigate()
  const location = useLocation()
  const [closedBanner, setClosedBanner] = useState(false)

  const session = JSON.parse(localStorage.getItem('vntrbirds_session') || 'null')

  useEffect(() => {
    if (location.state?.closed) setClosedBanner(true)
  }, [location.state])

  function handleSubmitFind() {
    navigate('/hunt')
  }

  function handleAddTeam() {
    navigate('/register')
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <header className="flex flex-col items-center pt-6 pb-4 px-3">
        <a
          href="https://www.vntrbirds.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="VNTRbirds website (opens in new tab)"
        >
          <img
            src="/logo.png"
            alt="Venture Out Femme Backcountry Festival — Salida, CO"
            className="w-full max-w-[500px] select-none"
            draggable={false}
          />
        </a>
      </header>

      {/* ── Actions + Leaderboard ──────────────────────────────────── */}
      <main className="flex-1 flex flex-col px-5 pb-10 max-w-md mx-auto w-full">

        {closedBanner && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-brand-magenta/40 bg-brand-magenta/10 px-4 py-3 text-base font-semibold text-brand-magentaVibrant"
          >
            Hunt registration is closed.
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 mb-8">
          {session ? (
            <button
              onClick={handleSubmitFind}
              className="min-tap w-full rounded-full border-2 border-white text-white text-base font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5 text-brand-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Submit a find
            </button>
          ) : (
            <button
              onClick={handleAddTeam}
              className="min-tap w-full rounded-full border-2 border-white text-white text-base font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5 text-brand-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16M20 4v16M4 20L20 4" />
              </svg>
              Get started
            </button>
          )}
        </div>

        {/* Leaderboard — hidden when no submissions */}
        <LeaderboardList currentTeamId={session?.team_id} showHeading />
      </main>

    </div>
  )
}
