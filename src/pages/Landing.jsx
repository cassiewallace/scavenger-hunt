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
    navigate('/submit')
  }

  function handleAddTeam() {
    navigate('/register')
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <header className="flex flex-col items-center pt-10 pb-4 px-6">
        {/*
          Brand image — save your logo to public/logo.png
          Alt text describes the visual for screen readers.
        */}
        <a
          href="https://www.vntrbirds.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="VNTRbirds website (opens in new tab)"
        >
          <img
            src="/logo.png"
            alt="Venture Out Femme Backcountry Festival — Salida, CO"
            className="w-full max-w-[280px] mx-auto select-none"
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
          {session && (
            <button
              onClick={handleSubmitFind}
              className="min-tap w-full rounded-xl border-2 border-brand-primary text-brand-primary font-display text-2xl tracking-wider hover:bg-brand-primary/10 active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              Submit a Find
            </button>
          )}

          <button
            onClick={handleAddTeam}
            className="min-tap w-full rounded-xl border-2 border-brand-teal text-brand-teal font-display text-2xl tracking-wider hover:bg-brand-teal/10 active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            {session ? 'Change Team' : 'Add a Team'}
          </button>
        </div>

        {/* Leaderboard */}
        <section aria-labelledby="lb-heading">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="lb-heading"
              className="text-xs font-bold tracking-widest uppercase text-white/50"
            >
              Leaderboard
            </h2>
          </div>

          <LeaderboardList currentTeamId={session?.team_id} />
        </section>
      </main>

    </div>
  )
}
