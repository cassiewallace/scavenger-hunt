import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import JSZip from 'jszip'

const ADMIN_PASSPHRASE = import.meta.env.VITE_ADMIN_PASSPHRASE

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('vntrbirds_admin') === 'true')
  const [passphraseInput, setPassphraseInput] = useState('')
  const [passphraseError, setPassphraseError] = useState(false)

  const [submissionsOpen, setSubmissionsOpen] = useState(true)
  const [toggling, setToggling] = useState(false)

  const [teams, setTeams] = useState([])
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  function handlePassphrase(e) {
    e.preventDefault()
    if (passphraseInput === ADMIN_PASSPHRASE) {
      sessionStorage.setItem('vntrbirds_admin', 'true')
      setAuthed(true)
    } else {
      setPassphraseError(true)
      setPassphraseInput('')
    }
  }

  useEffect(() => {
    if (!authed) return
    loadData()

    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'submissions_open')
      .single()
      .then(({ data }) => { if (data) setSubmissionsOpen(data.value === 'true') })

    const channel = supabase
      .channel('admin_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
        if (payload.new?.key === 'submissions_open') {
          setSubmissionsOpen(payload.new.value === 'true')
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, () => {
        loadData()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [authed])

  async function loadData() {
    setLoading(true)
    const { data: subs } = await supabase
      .from('submissions')
      .select('*, teams(team_name)')
      .order('created_at', { ascending: true })

    if (!subs) { setLoading(false); return }

    const byTeam = {}
    for (const sub of subs) {
      const id = sub.team_id
      if (!byTeam[id]) {
        byTeam[id] = {
          team_id: id,
          team_name: sub.teams?.team_name || 'Unknown',
          total_points: 0,
          submissions: [],
        }
      }
      byTeam[id].total_points += sub.points || 0
      byTeam[id].submissions.push(sub)
    }

    const sorted = Object.values(byTeam).sort((a, b) => b.total_points - a.total_points)
    setTeams(sorted)
    setLoading(false)
  }

  async function toggleSubmissions() {
    setToggling(true)
    const newValue = !submissionsOpen
    const { error } = await supabase
      .from('app_settings')
      .update({ value: newValue ? 'true' : 'false' })
      .eq('key', 'submissions_open')
    if (!error) setSubmissionsOpen(newValue)
    setToggling(false)
  }

  async function downloadAll() {
    setDownloading(true)
    setDownloadError('')
    try {
      const zip = new JSZip()
      for (const team of teams) {
        const folder = zip.folder(team.team_name)
        for (const sub of team.submissions) {
          if (!sub.file_path) continue
          const { data, error } = await supabase.storage
            .from('hunt-submissions')
            .download(sub.file_path)
          if (error || !data) continue
          const ext = sub.file_path.split('.').pop() || 'bin'
          folder.file(`${sub.item_id}.${ext}`, data)
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'vntrbirds-submissions.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6">
        <h1 className="font-display text-5xl text-white mb-8">Admin</h1>
        <form onSubmit={handlePassphrase} className="flex flex-col gap-4 w-full max-w-xs">
          <input
            type="password"
            value={passphraseInput}
            onChange={(e) => { setPassphraseInput(e.target.value); setPassphraseError(false) }}
            placeholder="Enter passphrase"
            className={`w-full px-4 py-4 rounded-xl border-2 focus:outline-none text-base text-white bg-brand-surface placeholder:text-white/30 transition-colors ${
              passphraseError ? 'border-brand-error' : 'border-white/10 focus:border-brand-teal'
            }`}
            autoFocus
            aria-invalid={passphraseError}
            aria-describedby={passphraseError ? 'passphrase-err' : undefined}
          />
          {passphraseError && (
            <p id="passphrase-err" role="alert" className="text-brand-error text-sm text-center">Incorrect passphrase.</p>
          )}
          <button
            type="submit"
            className="min-tap w-full rounded-xl bg-brand-primary text-white text-lg font-bold"
          >
            Enter
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-brand-surface border-b border-white/10 text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-4xl leading-none text-white">Admin</h1>
          <button
            onClick={() => { sessionStorage.removeItem('vntrbirds_admin'); setAuthed(false) }}
            className="text-xs text-white/50 underline underline-offset-2"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        {/* Submissions toggle */}
        <section className="mt-6 bg-brand-surface rounded-xl border border-white/5 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white text-base">Submissions Open / Closed</div>
              <div className="text-sm text-white/50 mt-0.5">
                Currently:{' '}
                <span className={submissionsOpen ? 'text-brand-success font-bold' : 'text-brand-error font-bold'}>
                  {submissionsOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleSubmissions}
              disabled={toggling}
              className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none ${
                submissionsOpen ? 'bg-brand-success/80' : 'bg-white/20'
              } disabled:opacity-60`}
              aria-label={`Submissions are ${submissionsOpen ? 'open' : 'closed'}. Toggle to ${submissionsOpen ? 'close' : 'open'}.`}
              aria-pressed={submissionsOpen}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${
                  submissionsOpen ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Download */}
        <section className="mt-4">
          {/* bg brand-secondary teal → dark text 9.4:1 (WCAG AAA) */}
          <button
            onClick={downloadAll}
            disabled={downloading}
            className="w-full min-tap flex items-center justify-center gap-2 bg-brand-secondary text-brand-bg rounded-xl text-base font-bold shadow-md disabled:opacity-50 active:scale-95 transition-transform"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Downloading…
              </>
            ) : (
              'Download All Submissions'
            )}
          </button>
          {downloadError && (
            <p role="alert" className="mt-2 text-brand-error text-sm text-center">{downloadError}</p>
          )}
        </section>

        {/* Teams */}
        <section className="mt-6">
          <h2 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-3">
            Teams ({teams.length})
          </h2>

          {loading ? (
            <div className="text-center text-white/40 text-sm py-10">Loading…</div>
          ) : teams.length === 0 ? (
            <div className="text-center text-white/40 text-sm py-10">No submissions yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {teams.map((team) => (
                <div key={team.team_id} className="bg-brand-surface rounded-xl border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setExpandedTeam(expandedTeam === team.team_id ? null : team.team_id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                    aria-expanded={expandedTeam === team.team_id}
                  >
                    <div>
                      <div className="font-semibold text-white">{team.team_name}</div>
                      <div className="text-sm text-white/40">{team.submissions.length} item{team.submissions.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-teal text-lg">{team.total_points} pts</span>
                      <svg
                        className={`w-5 h-5 text-white/40 transition-transform ${expandedTeam === team.team_id ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {expandedTeam === team.team_id && (
                    <div className="border-t border-white/5 divide-y divide-white/5">
                      {team.submissions.map((sub) => (
                        <AdminSubmissionRow key={sub.id} sub={sub} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function AdminSubmissionRow({ sub }) {
  const [thumbUrl, setThumbUrl] = useState(null)

  useEffect(() => {
    if (!sub.file_path) return
    const { data } = supabase.storage.from('hunt-submissions').getPublicUrl(sub.file_path)
    if (data?.publicUrl) setThumbUrl(data.publicUrl)
  }, [sub.file_path])

  const isVideo = sub.file_path && /\.(mp4|mov|webm|avi)$/i.test(sub.file_path)

  return (
    <div className="px-5 py-3 flex items-start gap-3">
      {/* Media preview */}
      {thumbUrl && (
        <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-white/10">
          {isVideo ? (
            <video src={thumbUrl} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <img src={thumbUrl} alt={sub.item_label} className="w-full h-full object-cover" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm truncate">{sub.item_label}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-brand-teal font-semibold">{sub.points} pts</span>
          <span className="text-xs text-white/40">
            {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {sub.ig_post_url && (
          <a
            href={sub.ig_post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-blue underline underline-offset-2 mt-0.5 inline-block"
          >
            View IG Post
          </a>
        )}
      </div>
    </div>
  )
}
