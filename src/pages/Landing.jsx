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
export default function Landing({ submissionsOpen, settingsLoaded }) {
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
            className="w-full max-w-[300px] select-none"
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

        {/* CTA buttons — hidden once submissions are closed */}
        {(!settingsLoaded || submissionsOpen) && (
          <div className="flex flex-col gap-3 mb-8">
            {session ? (
              <button
                onClick={handleSubmitFind}
                className="min-tap w-full rounded-full bg-white border-2 border-black text-black text-base font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-100 active:scale-95 transition-transform"
              >
                <svg className="w-5 h-5 text-brand-teal flex-shrink-0" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
                  <path d="M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.66-3.56L100.28,48h55.43l13.63,20.44A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z" />
                </svg>
                Submit a find
              </button>
            ) : (
              <button
                onClick={handleAddTeam}
                className="min-tap w-full rounded-full bg-white border-2 border-black text-black text-base font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-100 active:scale-95 transition-transform"
              >
                <svg className="w-5 h-5 text-brand-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16M20 4v16M4 20L20 4" />
                </svg>
                Get started
              </button>
            )}
          </div>
        )}

        {/* Leaderboard — hidden when no submissions */}
        <LeaderboardList currentTeamId={session?.team_id} showHeading />
      </main>

      <footer className="text-center text-[0.8em] italic text-white/40 px-4 py-6">
        Built with ♥ in Summit County, CO by{' '}
        <a href="https://cassiewallace.net" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/70 transition-colors">Cassie Wallace</a>
        {' '}and{' '}
        <a href="https://vntrbirds.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/70 transition-colors">VNTRbirds</a>.
      </footer>

    </div>
  )
}
