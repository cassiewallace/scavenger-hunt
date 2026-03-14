import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import items from '../items'
import ItemCard from '../components/ItemCard'
import FeatherIcon from '../components/FeatherIcon'

export default function Hunt({ submissionsOpen }) {
  const navigate = useNavigate()
  const session = JSON.parse(localStorage.getItem('vntrbirds_session') || 'null')
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [hideCompleted, setHideCompleted] = useState(false)

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
  const totalPossiblePoints = items.reduce((sum, i) => sum + i.points, 0)

  const sponsorItems = items.filter((i) => i.item_type === 'sponsor')
  const standardItems = items.filter((i) => i.item_type === 'standard').slice().sort((a, b) => b.points - a.points)
  const allItems = [...sponsorItems, ...standardItems]

  const filtered = allItems
    .filter((i) => !filter.trim() || i.label.toLowerCase().includes(filter.trim().toLowerCase()))
    .filter((i) => !hideCompleted || !foundMap[i.id])

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-brand-surface border-b border-white/10 text-white px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate('/')}
              aria-label="Back to home"
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="text-white font-bold text-lg leading-tight truncate">{session?.team_name}</p>
          </div>
          <p className="text-brand-teal font-semibold text-sm flex items-center gap-1 flex-shrink-0">
            {totalPoints} of {totalPossiblePoints} <FeatherIcon />
          </p>
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

        {/* Search + filter */}
        <div className="sticky top-12 z-30 pt-4 pb-3 flex gap-2">
          <input
            type="search"
            placeholder="Search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 focus:border-brand-teal focus:outline-none text-sm text-white bg-brand-surface placeholder:text-white/50 transition-colors"
          />
          <button
            onClick={() => setHideCompleted((v) => !v)}
            className={`flex-shrink-0 px-3 py-3 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              hideCompleted
                ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                : 'border-white/10 text-white/60 hover:text-white/80'
            }`}
            aria-pressed={hideCompleted}
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
              <path d="M200,136a8,8,0,0,1-8,8H64a8,8,0,0,1,0-16H192A8,8,0,0,1,200,136Zm32-56H24a8,8,0,0,0,0,16H232a8,8,0,0,0,0-16Zm-80,96H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z" />
            </svg>
            Not done
          </button>
        </div>

        {loading ? (
          <div className="mt-16 text-center text-white/60 text-sm">Loading your hunt…</div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center text-white/60 text-sm">No items match "{filter}"</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                submission={foundMap[item.id]}
                session={session}
                submissionsOpen={submissionsOpen}
                onFound={handleFound}
                isSponsor={item.item_type === 'sponsor'}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
