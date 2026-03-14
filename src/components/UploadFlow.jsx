import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const MAX_FILE_MB = 50

export default function UploadFlow({ item, session, onFound, onAlreadyFound, onClose, uploading, setUploading, isSponsor }) {
  const c = isSponsor ? {
    filePicker: 'border-black/20 text-gray-500 hover:border-brand-teal hover:text-brand-teal',
    fileSelected: 'text-gray-700 bg-black/5 border border-black/10',
    fileIcon: 'text-gray-400',
    fileName: 'text-gray-900',
    removeBtn: 'text-gray-400',
    label: 'text-gray-600',
    input: 'border-black/10 focus:border-brand-teal text-gray-900 bg-black/5 placeholder:text-gray-400',
    progress: 'bg-black/10',
    submitBtn: 'border-2 border-gray-900 text-gray-900 hover:bg-black/5',
  } : {
    filePicker: 'border-white/20 text-white/60 hover:border-brand-teal hover:text-brand-teal',
    fileSelected: 'text-white/70 bg-white/5 border border-white/10',
    fileIcon: 'text-white/40',
    fileName: 'text-white',
    removeBtn: 'text-white/40',
    label: 'text-white/70',
    input: 'border-white/10 focus:border-brand-teal text-white bg-white/5 placeholder:text-white/50',
    progress: 'bg-white/10',
    submitBtn: 'border-2 border-white text-white hover:bg-white/10',
  }
  const [selectedFile, setSelectedFile] = useState(null)
  const [igUrl, setIgUrl] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [sizeWarning, setSizeWarning] = useState(false)
  const fileRef = useRef(null)

  const isHypeVideo = item.id === 'hype_video'

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSizeWarning(false)
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setSizeWarning(true)
    }
    setSelectedFile(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setError('')
    setUploading(true)
    setProgress(5)

    try {
      const ext = selectedFile.name.split('.').pop() || 'bin'
      const timestamp = Date.now()
      const safeTeamName = session.team_name.replace(/[^a-zA-Z0-9_-]/g, '_')
      const filePath = `${safeTeamName}/${item.id}-${timestamp}.${ext}`

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('hunt-submissions')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const pct = Math.round((progress.loaded / progress.total) * 85)
            setProgress(5 + pct)
          },
        })

      if (uploadErr) throw uploadErr
      setProgress(90)

      // Insert submission row
      const { data: sub, error: insertErr } = await supabase
        .from('submissions')
        .insert({
          team_id: session.team_id,
          item_id: item.id,
          item_label: item.label,
          points: item.points,
          item_type: item.item_type,
          file_path: filePath,
          ig_post_url: isHypeVideo && igUrl.trim() ? igUrl.trim() : null,
        })
        .select()
        .single()

      // Handle unique constraint — item already submitted
      if (insertErr?.code === '23505' || insertErr?.message?.includes('unique')) {
        setProgress(0)
        onClose()
        setSelectedFile(null)
        onAlreadyFound()
        return
      }

      if (insertErr) throw insertErr

      setProgress(100)
      onFound(sub)
      onClose()
      setSelectedFile(null)
      setIgUrl('')
      setProgress(0)
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 pt-1">
      {/* File picker */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
        id={`file-${item.id}`}
      />

      {selectedFile ? (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${c.fileSelected}`}>
          <svg className={`w-4 h-4 flex-shrink-0 ${c.fileIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className={`truncate flex-1 ${c.fileName}`}>{selectedFile.name}</span>
          <button
            onClick={() => { setSelectedFile(null); setError(''); setSizeWarning(false) }}
            className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-xl font-bold ${c.removeBtn} hover:opacity-80`}
            aria-label="Remove selected file"
          >
            ✕
          </button>
        </div>
      ) : (
        <label
          htmlFor={`file-${item.id}`}
          className={`min-tap flex items-center justify-center gap-2 border-2 border-dashed rounded-lg text-sm font-medium cursor-pointer transition-colors ${c.filePicker}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Tap to pick photo or video
        </label>
      )}

      {sizeWarning && (
        <p role="alert" className="text-xs text-brand-warning font-medium">
          Heads up: this file is over 50 MB and may be slow to upload.
        </p>
      )}

      {/* IG URL field for hype_video */}
      {isHypeVideo && (
        <div>
          <label className={`block text-xs font-semibold mb-1 ${c.label}`}>
            Tag us on IG for +25 feathers! Paste your post link here (honor system)
          </label>
          <input
            type="url"
            value={igUrl}
            onChange={(e) => setIgUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/..."
            className={`w-full px-3 py-2 rounded-lg border focus:outline-none text-sm ${c.input}`}
          />
        </div>
      )}

      {/* Upload progress */}
      {uploading && progress > 0 && (
        <div
          className={`w-full rounded-full h-2 overflow-hidden ${c.progress}`}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div
            className="h-2 bg-brand-teal rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-center justify-between bg-brand-error/10 border border-brand-error/40 rounded-lg px-3 py-2">
          <p className="text-brand-error text-xs flex-1">{error}</p>
          <button
            onClick={handleUpload}
            className="text-xs text-brand-error font-semibold underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className={`w-full min-tap rounded-full text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-transform ${c.submitBtn}`}
      >
        {uploading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Uploading…
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-brand-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16M20 4v16M4 20L20 4" />
            </svg>
            Submit
          </>
        )}
      </button>
    </div>
  )
}
