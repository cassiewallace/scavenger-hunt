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
          Brand image — save your logo to public/venture-out-logo.png
          Alt text describes the visual for screen readers.
        */}
        <img
          src="/venture-out-logo.png"
          alt="Venture Out Femme Backcountry Festival — Salida, CO"
          className="w-full max-w-[280px] mx-auto select-none"
          draggable={false}
        />
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
          {/*
            "Submit a Find"
            bg: brand-primary #b030ba → white text → 5.3:1 contrast (WCAG AA ✓)
          */}
          <button
            onClick={handleSubmitFind}
            className="min-tap w-full rounded-xl bg-brand-primary text-white text-lg font-bold shadow-lg active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            Submit a Find
          </button>

          {/*
            "Add a Team"
            bg: brand-secondary teal #26c4bc → dark text #0f0f0f → 9.4:1 contrast (WCAG AAA ✓)
          */}
          <button
            onClick={handleAddTeam}
            className="min-tap w-full rounded-xl bg-brand-secondary text-brand-bg text-lg font-bold shadow-lg active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
          >
            Add a Team
          </button>
        </div>

        {/* Live Leaderboard */}
        <section aria-labelledby="lb-heading">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="lb-heading"
              className="text-xs font-bold tracking-widest uppercase text-white/50"
            >
              Live Leaderboard
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-brand-teal font-semibold" aria-hidden="true">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
              Live
            </span>
          </div>

          <LeaderboardList currentTeamId={session?.team_id} />
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="py-5 text-center">
        <a
          href="https://www.vntrbirds.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/40 hover:text-white/70 underline underline-offset-4 transition-colors"
          aria-label="VNTRbirds website (opens in new tab)"
        >
          vntrbirds.com
        </a>
      </footer>
    </div>
  )
}
