import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Leaderboard({ session }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [animatingIds, setAnimatingIds] = useState(new Set())

  async function loadLeaderboard() {
    const { data } = await supabase
      .from('submissions')
      .select('team_id, points, teams(team_name)')
    if (!data) return

    const byTeam = {}
    for (const row of data) {
      const id = row.team_id
      if (!byTeam[id]) {
        byTeam[id] = {
          team_id: id,
          team_name: row.teams?.team_name || 'Unknown',
          total_points: 0,
          item_count: 0,
        }
      }
      byTeam[id].total_points += row.points || 0
      byTeam[id].item_count += 1
    }

    const sorted = Object.values(byTeam).sort((a, b) => b.total_points - a.total_points)
    setRows(sorted)
    setLoading(false)
  }

  useEffect(() => {
    loadLeaderboard()

    const channel = supabase
      .channel('leaderboard_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions' },
        (payload) => {
          const newTeamId = payload.new?.team_id
          if (newTeamId) {
            setAnimatingIds((prev) => new Set([...prev, newTeamId]))
            setTimeout(() => {
              setAnimatingIds((prev) => {
                const next = new Set(prev)
                next.delete(newTeamId)
                return next
              })
            }, 800)
          }
          loadLeaderboard()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-brand-surface border-b border-white/10 text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-4xl leading-none text-white">Leaderboard</h1>
          <div className="flex items-center gap-3">
            {session && (
              <Link to="/hunt" className="text-brand-teal text-sm font-semibold underline underline-offset-2">
                My Hunt
              </Link>
            )}
            <Link to="/" className="text-white/50 text-sm underline underline-offset-2">Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="mt-16 text-center text-white/40 text-sm" aria-live="polite">Loading scores…</div>
        ) : rows.length === 0 ? (
          <div className="mt-16 text-center text-white/40 text-sm" aria-live="polite">No submissions yet — be the first!</div>
        ) : (
          <ol className="mt-6 flex flex-col gap-2" aria-label="Live leaderboard">
            {rows.map((team, idx) => (
              <li
                key={team.team_id}
                className={[
                  'flex items-center gap-3 bg-brand-surface rounded-xl px-4 py-3 border border-white/5 transition-all duration-500',
                  animatingIds.has(team.team_id) ? 'animate-slide-in' : '',
                  team.team_id === session?.team_id ? 'ring-1 ring-brand-teal border-brand-teal/40' : '',
                ].join(' ')}
              >
                <div
                  className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-yellow-400 text-black'
                    : idx === 1 ? 'bg-gray-300 text-black'
                    : idx === 2 ? 'bg-amber-600 text-white'
                    : 'bg-white/10 text-white/60'
                  }`}
                  aria-label={`Rank ${idx + 1}`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">
                    {team.team_name}
                    {team.team_id === session?.team_id && (
                      <span className="ml-2 text-xs font-normal text-brand-teal">(you)</span>
                    )}
                  </div>
                  <div className="text-xs text-white/40">{team.item_count} item{team.item_count !== 1 ? 's' : ''} found</div>
                </div>
                <div className="font-bold text-brand-teal text-lg tabular-nums flex-shrink-0">
                  {team.total_points}
                  <span className="text-xs font-normal text-white/40 ml-0.5">pts</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  )
}
