import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import items from '../items'
import ItemCard from '../components/ItemCard'

export default function Submit() {
  const navigate = useNavigate()
  const session = JSON.parse(localStorage.getItem('vntrbirds_session') || 'null')

  const [submissions, setSubmissions] = useState([])
  const [submissionsOpen, setSubmissionsOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!session) { navigate('/'); return }

    supabase
      .from('submissions')
      .select('*')
      .eq('team_id', session.team_id)
      .then(({ data }) => {
        setSubmissions(data || [])
        setLoading(false)
      })

    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'submissions_open')
      .single()
      .then(({ data }) => {
        if (data) setSubmissionsOpen(data.value === 'true')
      })
  }, [])

  const handleFound = useCallback((newSub) => {
    setSubmissions((prev) => {
      const exists = prev.find((s) => s.item_id === newSub.item_id)
      if (exists) return prev
      return [...prev, newSub]
    })
  }, [])

  const foundMap = Object.fromEntries(submissions.map((s) => [s.item_id, s]))

  const sponsorItems = items.filter((i) => i.item_type === 'sponsor')
  const standardItems = items.filter((i) => i.item_type === 'standard')
  const allItems = [...sponsorItems, ...standardItems]

  const filtered = filter.trim()
    ? allItems.filter((i) => i.label.toLowerCase().includes(filter.trim().toLowerCase()))
    : allItems

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <header className="sticky top-0 z-10 bg-brand-surface border-b border-white/10 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-white/50 text-sm min-tap -ml-1"
            aria-label="Back to home"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-white/60 text-sm">{session?.team_name}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 pb-12 flex flex-col flex-1">
        {/* Search filter */}
        <div className="sticky top-[57px] z-10 bg-brand-bg pt-4 pb-3">
          <input
            type="search"
            placeholder="Filter items…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-brand-teal focus:outline-none text-sm text-white bg-brand-surface placeholder:text-white/30 transition-colors"
          />
        </div>

        {loading ? (
          <div className="mt-16 text-center text-white/40 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center text-white/40 text-sm">No items match "{filter}"</div>
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
