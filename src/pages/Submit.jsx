import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import items from '../items'

const MAX_FILE_MB = 50

export default function Submit() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [teams, setTeams] = useState([])
  const [teamId, setTeamId] = useState('')
  const [teamQuery, setTeamQuery] = useState('')
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false)
  const teamComboRef = useRef(null)
  const [itemId, setItemId] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [sizeWarning, setSizeWarning] = useState(false)
  const [igUrl, setIgUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase
      .from('teams')
      .select('id, team_name')
      .order('team_name')
      .then(({ data }) => {
        if (data) setTeams(data)
      })
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (teamComboRef.current && !teamComboRef.current.contains(e.target)) {
        setTeamDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredTeams = teams.filter(t =>
    t.team_name.toLowerCase().includes(teamQuery.toLowerCase())
  )

  function selectTeam(team) {
    setTeamId(team.id)
    setTeamQuery(team.team_name)
    setTeamDropdownOpen(false)
  }

  const selectedItem = items.find(i => i.id === itemId)
  const isHypeVideo = itemId === 'hype_video'

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSizeWarning(file.size > MAX_FILE_MB * 1024 * 1024)
    setSelectedFile(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!teamId || !itemId || !selectedFile) return

    const team = teams.find(t => t.id === teamId)
    setError('')
    setUploading(true)
    setProgress(5)

    try {
      const ext = selectedFile.name.split('.').pop() || 'bin'
      const safeTeamName = team.team_name.replace(/[^a-zA-Z0-9_-]/g, '_')
      const filePath = `${safeTeamName}/${itemId}-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('hunt-submissions')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (p) => {
            setProgress(5 + Math.round((p.loaded / p.total) * 85))
          },
        })

      if (uploadErr) throw uploadErr
      setProgress(90)

      const { error: insertErr } = await supabase
        .from('submissions')
        .insert({
          team_id: teamId,
          item_id: selectedItem.id,
          item_label: selectedItem.label,
          points: selectedItem.points,
          item_type: selectedItem.item_type,
          file_path: filePath,
          ig_post_url: isHypeVideo && igUrl.trim() ? igUrl.trim() : null,
        })

      if (insertErr?.code === '23505' || insertErr?.message?.includes('unique')) {
        setError('This item was already submitted for that team.')
        setProgress(0)
        setUploading(false)
        return
      }

      if (insertErr) throw insertErr

      setProgress(100)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">Find Submitted!</h1>
          <p className="text-white/60 mb-8">+{selectedItem?.points} pts for {teams.find(t => t.id === teamId)?.team_name}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setDone(false); setSelectedFile(null); setItemId(''); setIgUrl(''); setProgress(0); setTeamId(''); setTeamQuery('') }}
              className="min-tap w-full rounded-xl bg-brand-primary text-white text-lg font-bold active:scale-95 transition-transform"
            >
              Submit Another Find
            </button>
            <button
              onClick={() => navigate('/')}
              className="min-tap w-full rounded-xl border border-white/20 text-white/70 text-lg font-semibold active:scale-95 transition-transform"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="flex-1 flex flex-col px-5 py-10 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-white/50 text-sm mb-8 -ml-1 min-tap self-start"
          aria-label="Back to home"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-8">Submit a Find</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Team combobox */}
          <div ref={teamComboRef} className="relative">
            <label htmlFor="team-input" className="block text-sm font-semibold text-white/80 mb-2">
              Team
            </label>
            <input
              id="team-input"
              type="text"
              autoComplete="off"
              placeholder="Select or type your team…"
              value={teamQuery}
              onChange={e => {
                setTeamQuery(e.target.value)
                setTeamId('')
                setTeamDropdownOpen(true)
              }}
              onFocus={() => setTeamDropdownOpen(true)}
              className="w-full px-4 py-4 rounded-xl border-2 border-white/10 focus:border-brand-teal focus:outline-none text-base text-white bg-brand-surface transition-colors placeholder:text-white/30"
              required
            />
            {teamDropdownOpen && filteredTeams.length > 0 && (
              <ul
                role="listbox"
                className="absolute z-10 mt-1 w-full bg-brand-surface border border-white/10 rounded-xl overflow-auto max-h-56 shadow-xl"
              >
                {filteredTeams.map(t => (
                  <li
                    key={t.id}
                    role="option"
                    aria-selected={t.id === teamId}
                    onMouseDown={() => selectTeam(t)}
                    className={[
                      'px-4 py-3 text-base cursor-pointer transition-colors',
                      t.id === teamId
                        ? 'bg-brand-teal/20 text-brand-teal font-semibold'
                        : 'text-white hover:bg-white/10',
                    ].join(' ')}
                  >
                    {t.team_name}
                  </li>
                ))}
              </ul>
            )}
            {teamDropdownOpen && filteredTeams.length === 0 && teamQuery && (
              <div className="absolute z-10 mt-1 w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-white/40 text-sm shadow-xl">
                No teams match "{teamQuery}"
              </div>
            )}
          </div>

          {/* Item dropdown */}
          <div>
            <label htmlFor="item" className="block text-sm font-semibold text-white/80 mb-2">
              Find
            </label>
            <select
              id="item"
              value={itemId}
              onChange={e => setItemId(e.target.value)}
              className="w-full px-4 py-4 rounded-xl border-2 border-white/10 focus:border-brand-teal focus:outline-none text-base text-white bg-brand-surface transition-colors appearance-none"
              required
            >
              <option value="" disabled className="text-white/30">Select a find…</option>
              <optgroup label="Hunt Items">
                {items.filter(i => i.item_type === 'standard').map(i => (
                  <option key={i.id} value={i.id} className="text-white bg-brand-surface">
                    {i.label} ({i.points} pts)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Sponsor Items">
                {items.filter(i => i.item_type === 'sponsor').map(i => (
                  <option key={i.id} value={i.id} className="text-white bg-brand-surface">
                    {i.label} ({i.points} pts)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">
              Photo or Video
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              id="media-upload"
            />
            {selectedFile ? (
              <div className="flex items-center gap-2 text-sm text-white/70 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="truncate flex-1 text-white">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setSizeWarning(false) }}
                  className="text-white/40 flex-shrink-0"
                  aria-label="Remove file"
                >✕</button>
              </div>
            ) : (
              <label
                htmlFor="media-upload"
                className="min-tap flex items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-xl text-white/60 text-sm font-medium cursor-pointer hover:border-brand-teal hover:text-brand-teal transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Tap to take or choose photo / video
              </label>
            )}
            {sizeWarning && (
              <p className="text-xs text-brand-warning font-medium mt-1.5">
                Heads up: file is over 50 MB and may be slow to upload.
              </p>
            )}
          </div>

          {/* IG URL for hype_video */}
          {isHypeVideo && (
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Tag us on IG for +25 pts — paste your post link (honor system)
              </label>
              <input
                type="url"
                value={igUrl}
                onChange={e => setIgUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-brand-teal focus:outline-none text-sm text-white bg-brand-surface placeholder:text-white/30"
              />
            </div>
          )}

          {/* Progress bar */}
          {uploading && progress > 0 && (
            <div
              className="w-full bg-white/10 rounded-full h-2 overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-2 bg-brand-teal rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && (
            <div role="alert" className="bg-brand-error/10 border border-brand-error/40 rounded-xl px-4 py-3 text-brand-error text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!teamId || !itemId || !selectedFile || uploading}
            className="min-tap w-full rounded-xl bg-brand-primary text-white text-lg font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform mt-2"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading…
              </span>
            ) : 'Submit Find'}
          </button>
        </form>
      </div>
    </div>
  )
}
