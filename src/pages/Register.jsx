import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Pre-fill with last used team name
    const last = localStorage.getItem('vntrbirds_last_team')
    if (last) setTeamName(last)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const name = teamName.trim()
    if (!name) return
    setLoading(true)
    setError('')

    try {
      // Attempt to insert the team
      const { data: inserted, error: insertErr } = await supabase
        .from('teams')
        .insert({ team_name: name })
        .select('id, team_name')
        .single()

      if (!insertErr && inserted) {
        // New team created
        const session = { team_id: inserted.id, team_name: inserted.team_name }
        localStorage.setItem('vntrbirds_session', JSON.stringify(session))
        localStorage.setItem('vntrbirds_last_team', name)
        navigate('/hunt')
        return
      }

      // If unique constraint fired (team already exists), fetch existing team
      if (insertErr?.code === '23505' || insertErr?.message?.includes('unique')) {
        const { data: existing, error: fetchErr } = await supabase
          .from('teams')
          .select('id, team_name')
          .eq('team_name', name)
          .single()

        if (fetchErr || !existing) {
          setError('Could not join that team. Please try again.')
          return
        }

        const session = { team_id: existing.id, team_name: existing.team_name }
        localStorage.setItem('vntrbirds_session', JSON.stringify(session))
        localStorage.setItem('vntrbirds_last_team', name)
        navigate('/hunt')
        return
      }

      setError(insertErr?.message || 'Something went wrong. Please try again.')
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="Venture Out"
            className="w-32 mx-auto mb-4 select-none"
            draggable={false}
          />
          <p className="text-white/60 text-base">Enter your team name to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="teamName" className="block text-sm font-semibold text-white/80 mb-2">
              Team Name
            </label>
            {/* Input: white text on dark surface — bg #1c1c1c, text white: 17:1 contrast */}
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Your team name (or your name if flying solo)"
              className="w-full px-4 py-4 rounded-xl border-2 border-white/10 focus:border-brand-teal focus:outline-none text-base text-white bg-brand-surface placeholder:text-white/30 transition-colors"
              autoFocus
              autoComplete="off"
              maxLength={80}
            />
          </div>

          {error && (
            <div role="alert" className="bg-brand-error/10 border border-brand-error/40 rounded-lg px-4 py-3 text-brand-error text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !teamName.trim()}
            className="min-tap w-full rounded-xl border-2 border-brand-primary text-brand-primary font-display text-2xl tracking-wider hover:bg-brand-primary/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Joining…
              </span>
            ) : (
              "Let's Hunt"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Already registered? Use the same team name to resume your session on any device.
        </p>
      </div>
    </div>
  )
}
