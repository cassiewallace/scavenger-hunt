import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Reusable live leaderboard — renders a ranked list of teams by total points.
 * Subscribes to Supabase Realtime for instant updates.
 * Used by both Landing.jsx (inline) and Leaderboard.jsx (full page).
 */
export default function LeaderboardList({ currentTeamId, compact = false }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [animatingIds, setAnimatingIds] = useState(new Set())

  async function fetchScores() {
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
    fetchScores()

    const channel = supabase
      .channel('leaderboard_list_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions' },
        (payload) => {
          const tid = payload.new?.team_id
          if (tid) {
            setAnimatingIds((prev) => new Set([...prev, tid]))
            setTimeout(() => {
              setAnimatingIds((prev) => {
                const next = new Set(prev)
                next.delete(tid)
                return next
              })
            }, 800)
          }
          fetchScores()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  if (loading) {
    return (
      <div className="py-8 text-center text-white/50 text-sm" aria-live="polite">
        Loading scores…
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center text-white/50 text-sm" aria-live="polite">
        No submissions yet — be the first!
      </div>
    )
  }

  const medalColors = [
    'bg-yellow-400 text-black',   // Gold
    'bg-gray-300 text-black',     // Silver
    'bg-amber-600 text-white',    // Bronze
  ]

  return (
    <ol aria-label="Leaderboard" className="flex flex-col gap-2">
      {rows.map((team, idx) => {
        const isCurrentTeam = team.team_id === currentTeamId
        const medalClass = medalColors[idx] ?? 'bg-white/10 text-white/70'

        return (
          <li
            key={team.team_id}
            className={[
              'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500',
              compact ? 'py-2.5' : 'py-3',
              'bg-brand-surface border border-white/5',
              isCurrentTeam ? 'ring-1 ring-brand-teal border-brand-teal/40' : '',
              animatingIds.has(team.team_id) ? 'animate-slide-in' : '',
            ].join(' ')}
          >
            {/* Rank badge */}
            <div
              className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${medalClass}`}
              aria-label={`Rank ${idx + 1}`}
            >
              {idx + 1}
            </div>

            {/* Team info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate leading-tight">
                {team.team_name}
                {isCurrentTeam && (
                  <span className="ml-2 text-xs font-normal text-brand-teal">(you)</span>
                )}
              </div>
              </div>

            {/* Score */}
            <div className="font-bold text-brand-teal text-lg tabular-nums flex-shrink-0">
              {team.total_points}
              <span className="text-xs font-normal text-white/50 ml-0.5">pts</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
