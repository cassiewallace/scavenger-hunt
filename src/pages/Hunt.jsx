import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import items from '../items'
import ItemCard from '../components/ItemCard'

export default function Hunt({ submissionsOpen }) {
  const navigate = useNavigate()
  const session = JSON.parse(localStorage.getItem('vntrbirds_session') || 'null')
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) { navigate('/'); return }
    loadSubmissions()

    // Realtime: refresh when new submission comes in for this team
    const channel = supabase
      .channel(`hunt_submissions_${session.team_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
          filter: `team_id=eq.${session.team_id}`,
        },
        (payload) => {
          setSubmissions((prev) => {
            const exists = prev.find((s) => s.item_id === payload.new.item_id)
            if (exists) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session?.team_id])

  async function loadSubmissions() {
    setLoading(true)
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('team_id', session.team_id)
    setSubmissions(data || [])
    setLoading(false)
  }

  const handleFound = useCallback((newSub) => {
    setSubmissions((prev) => {
      const exists = prev.find((s) => s.item_id === newSub.item_id)
      if (exists) return prev
      return [...prev, newSub]
    })
  }, [])

  const foundMap = Object.fromEntries(submissions.map((s) => [s.item_id, s]))

  const totalPoints = submissions.reduce((sum, s) => sum + (s.points || 0), 0)
  const foundCount = submissions.length
  const totalCount = items.length

  const standardItems = items.filter((i) => i.item_type === 'standard')
  const sponsorItems = items.filter((i) => i.item_type === 'sponsor')

  function handleLogout() {
    localStorage.removeItem('vntrbirds_session')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-brand-surface border-b border-white/10 text-white px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <Link to="/">
              <h1 className="font-display text-3xl leading-none text-white">VNTRbirds</h1>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="text-xs font-semibold text-brand-teal underline underline-offset-2"
              >
                Leaderboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-white/50 underline underline-offset-2"
              >
                Log out
              </button>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-white/80 text-sm font-medium">{session?.team_name}</span>
            <span className="text-white/30">·</span>
            <span className="text-brand-teal font-bold text-sm">{totalPoints} pts</span>
            <span className="text-white/30">·</span>
            <span className="text-white/60 text-sm">
              {foundCount} of {totalCount} found
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        {/* Closed banner */}
        {!submissionsOpen && (
          <div
            role="alert"
            className="mt-4 bg-brand-magenta/10 border border-brand-magenta/40 rounded-xl px-4 py-3 text-brand-magentaVibrant text-sm font-semibold text-center"
          >
            Submissions are now closed. Thanks for playing!
          </div>
        )}

        {loading ? (
          <div className="mt-16 text-center text-white/40 text-sm">Loading your hunt…</div>
        ) : (
          <>
            {/* Standard Items */}
            <section className="mt-6">
              <h2 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-3">
                Hunt Items
              </h2>
              <div className="flex flex-col gap-3">
                {standardItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    submission={foundMap[item.id]}
                    session={session}
                    submissionsOpen={submissionsOpen}
                    onFound={handleFound}
                  />
                ))}
              </div>
            </section>

            {/* Sponsor Items */}
            <section className="mt-8">
              <h2 className="text-xs font-bold tracking-widest uppercase text-brand-magentaVibrant/80 mb-3">
                Sponsor Spotlights
              </h2>
              <div className="flex flex-col gap-3">
                {sponsorItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    submission={foundMap[item.id]}
                    session={session}
                    submissionsOpen={submissionsOpen}
                    onFound={handleFound}
                    isSponsor
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
