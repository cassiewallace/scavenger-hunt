import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import UploadFlow from './UploadFlow'

export default function ItemCard({ item, submission, session, submissionsOpen, onFound, isSponsor }) {
  const [uploading, setUploading] = useState(false)
  const [flash, setFlash] = useState(false)
  const [thumbUrl, setThumbUrl] = useState(null)
  const [alreadyFound, setAlreadyFound] = useState(false)

  const isFound = !!submission

  useEffect(() => {
    if (submission?.file_path) {
      const { data } = supabase.storage
        .from('hunt-submissions')
        .getPublicUrl(submission.file_path)
      if (data?.publicUrl) setThumbUrl(data.publicUrl)
    }
  }, [submission?.file_path])

  function handleFound(newSub) {
    setFlash(true)
    setTimeout(() => setFlash(false), 1000)
    onFound(newSub)
  }

  function handleAlreadyFound() {
    setAlreadyFound(true)
    setTimeout(() => setAlreadyFound(false), 3000)
  }

  // Card: dark surface; sponsor gets magenta left accent border
  const cardBase = [
    'rounded-xl bg-brand-surface border transition-all duration-300 overflow-hidden',
    isSponsor
      ? 'border-brand-magenta/30 border-l-4 border-l-brand-magentaVibrant shadow-md'
      : 'border-white/5',
    flash ? 'animate-green-flash' : '',
  ].join(' ')

  return (
    <div className={cardBase}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Found thumbnail */}
        {isFound && thumbUrl && (
          <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-white/10">
            {/\.(mp4|mov|webm|avi)$/i.test(submission.file_path) ? (
              <video
                src={thumbUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={thumbUrl}
                alt={item.label}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* text-white on brand-surface: 17:1 contrast (WCAG AAA) */}
              <p className="text-white font-medium text-sm leading-snug">{item.label}</p>
              {alreadyFound && (
                <p className="text-xs text-brand-magentaVibrant font-medium mt-0.5">Already submitted!</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              {/* Points badge: teal bg, dark text — 9.4:1 (WCAG AAA) */}
              <span className="bg-brand-teal/20 text-brand-teal text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap border border-brand-teal/30">
                {item.points} pts
              </span>
              {/* Found checkmark */}
              {isFound && (
                <span
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-brand-success/20 rounded-full"
                  aria-label="Found"
                >
                  <svg className="w-4 h-4 text-brand-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload flow for unfound items */}
      {!isFound && submissionsOpen && (
        <div className="px-4 pb-3">
          <UploadFlow
            item={item}
            session={session}
            onFound={handleFound}
            onAlreadyFound={handleAlreadyFound}
            uploading={uploading}
            setUploading={setUploading}
          />
        </div>
      )}
    </div>
  )
}
