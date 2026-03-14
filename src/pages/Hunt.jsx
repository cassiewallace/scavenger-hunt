import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const [sortByPoints, setSortByPoints] = useState(false)

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

  const sponsorItems = items.filter((i) => i.item_type === 'sponsor')
  const standardItems = items.filter((i) => i.item_type === 'standard')
  const allItems = [...sponsorItems, ...standardItems]

  const filtered = (filter.trim()
    ? allItems.filter((i) => i.label.toLowerCase().includes(filter.trim().toLowerCase()))
    : allItems
  ).slice().sort(sortByPoints ? (a, b) => b.points - a.points : () => 0)

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-brand-surface border-b border-white/10 text-white px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-2 flex-wrap">
          <span className="text-white/80 text-sm font-medium">{session?.team_name}</span>
          <span className="text-white/50" aria-hidden="true">·</span>
          <span className="text-brand-teal font-bold text-sm flex items-center gap-1">{totalPoints} feathers <FeatherIcon /></span>
          <span className="text-white/50" aria-hidden="true">·</span>
          <span className="text-white/80 text-sm">
            {foundCount} of {totalCount} found
          </span>
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

        {/* Search filter + sort */}
        <div className="sticky top-[57px] z-20 bg-brand-bg pt-4 pb-3 flex gap-2">
          <input
            type="search"
            placeholder="Filter items…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 focus:border-brand-teal focus:outline-none text-sm text-white bg-brand-surface placeholder:text-white/50 transition-colors"
          />
          <button
            onClick={() => setSortByPoints((s) => !s)}
            className={`flex-shrink-0 px-3 py-3 rounded-xl border text-sm font-medium transition-colors ${
              sortByPoints
                ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                : 'border-white/10 text-white/60 hover:text-white/80'
            }`}
            aria-pressed={sortByPoints}
            title="Sort by feather value"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
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
