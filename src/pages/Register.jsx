import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('create') // 'create' | 'join'
  const [teamName, setTeamName] = useState('')
  const [availableTeams, setAvailableTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [loading, setLoading] = useState(false)
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const last = localStorage.getItem('vntrbirds_last_team')
    if (last) setTeamName(last)
  }, [])

  useEffect(() => {
    if (mode === 'join') loadAvailableTeams()
  }, [mode])

  async function loadAvailableTeams() {
    setTeamsLoading(true)
    setSelectedTeamId('')
    // Try fetching with member_count to filter out full teams (max 2)
    const { data, error: fetchErr } = await supabase
      .from('teams')
      .select('id, team_name, member_count')
      .order('team_name')

    if (fetchErr) {
      // member_count column doesn't exist yet — show all teams
      const { data: all } = await supabase
        .from('teams')
        .select('id, team_name')
        .order('team_name')
      setAvailableTeams(all || [])
    } else {
      // Only show teams with fewer than 2 members (null counts as 0)
      setAvailableTeams(data.filter(t => (t.member_count ?? 0) < 2))
    }
    setTeamsLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'join') {
      if (!selectedTeamId) { setLoading(false); return }
      const team = availableTeams.find(t => String(t.id) === String(selectedTeamId))
      if (!team) { setLoading(false); return }
      const session = { team_id: team.id, team_name: team.team_name }
      localStorage.setItem('vntrbirds_session', JSON.stringify(session))
      localStorage.setItem('vntrbirds_last_team', team.team_name)
      navigate('/hunt')
      return
    }

    // Create mode
    const name = teamName.trim()
    if (!name) { setLoading(false); return }

    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('teams')
        .insert({ team_name: name })
        .select('id, team_name')
        .single()

      if (!insertErr && inserted) {
        const session = { team_id: inserted.id, team_name: inserted.team_name }
        localStorage.setItem('vntrbirds_session', JSON.stringify(session))
        localStorage.setItem('vntrbirds_last_team', name)
        navigate('/hunt')
        return
      }

      if (insertErr?.code === '23505' || insertErr?.message?.includes('unique')) {
        setError('A team with that name already exists. Try a different name, or join it from the "Join a team" tab.')
        return
      }

      setError(insertErr?.message || 'Something went wrong. Please try again.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = mode === 'join' ? !!selectedTeamId : !!teamName.trim()

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="flex flex-col items-center pt-6 pb-4 px-3">
        <Link to="/" aria-label="Home">
          <img
            src="/logo.png"
            alt="Venture Out"
            className="w-full max-w-[300px] select-none"
            draggable={false}
          />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-start pt-6 px-6 pb-6 max-w-md mx-auto w-full">
        {/* Mode tabs */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-6">
          {[
            { key: 'create', label: 'Create a team' },
            { key: 'join',   label: 'Join a team' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setMode(key); setError('') }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                mode === key
                  ? 'bg-brand-surface text-white shadow'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'create' ? (
            <div>
              <label htmlFor="teamName" className="block text-sm font-semibold text-white/80 mb-2">
                Team name
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Your team name (or your name if flying solo)"
                className="w-full px-4 py-4 rounded-xl border-2 border-white/10 focus:border-brand-teal focus:outline-none text-base text-white bg-brand-surface placeholder:text-white/50 transition-colors"
                autoFocus
                autoComplete="off"
                maxLength={80}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="teamSelect" className="block text-sm font-semibold text-white/80 mb-2">
                Pick a team to join
              </label>
              {teamsLoading ? (
                <div className="text-white/60 text-sm py-3">Loading teams…</div>
              ) : availableTeams.length === 0 ? (
                <div className="text-white/70 text-sm py-3">
                  No open teams right now — try creating one!
                </div>
              ) : (
                <select
                  id="teamSelect"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border-2 border-white/10 focus:border-brand-teal focus:outline-none text-base text-white bg-brand-surface transition-colors"
                >
                  <option value="">— Select a team —</option>
                  {availableTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.team_name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && (
            <div role="alert" className="bg-brand-error/10 border border-brand-error/40 rounded-lg px-4 py-3 text-brand-error text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="min-tap w-full rounded-full bg-white border-2 border-black text-black text-base font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {mode === 'join' ? 'Joining…' : 'Creating…'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-brand-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16M20 4v16M4 20L20 4" />
                </svg>
                {mode === 'join' ? 'Join Team' : 'Create Team'}
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  )
}
