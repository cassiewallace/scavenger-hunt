import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import UploadFlow from './UploadFlow'
import sponsorLogos from '../constants/sponsorLogos'
import FeatherIcon from './FeatherIcon'

export default function ItemCard({ item, submission, session, submissionsOpen, onFound, isSponsor }) {
  const [uploading, setUploading] = useState(false)
  const [flash, setFlash] = useState(false)
  const [thumbUrl, setThumbUrl] = useState(null)
  const [alreadyFound, setAlreadyFound] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

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

  const logoConfig = isSponsor ? sponsorLogos[item.id] : null
  const logoSrc = logoConfig ? `/sponsors/${logoConfig.file}` : null
  const logoLightBg = logoConfig?.lightBg ?? false

  // For sponsor items, label is "Sponsor Name — Item description"
  const [sponsorName, itemDesc] = isSponsor
    ? item.label.split(' — ')
    : [null, item.label]

  const cardBase = [
    'rounded-xl border transition-all duration-300 overflow-hidden',
    isSponsor
      ? 'bg-white border-brand-magenta/20 border-l-4 border-l-brand-magentaVibrant shadow-md'
      : 'bg-brand-surface border-white/5',
    flash ? 'animate-green-flash' : '',
  ].join(' ')

  return (
    <div className={cardBase}>
      <div className={`flex items-center gap-3 px-4 ${isSponsor ? 'py-4' : 'py-3'}`}>
        {/* Left slot: thumbnail if found, camera button if not */}
        {isFound && thumbUrl ? (
          <div className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden ${isSponsor ? 'bg-black/10' : 'bg-white/10'}`}>
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
        ) : !isFound && submissionsOpen ? (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex-shrink-0 w-14 h-14 rounded-lg bg-brand-primary flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Submit find"
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        ) : null}

        {/* Item info */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {/* Text lockup */}
          <div className="flex-1 min-w-0">
            {isSponsor && (
              <p className="text-black/50 text-xs font-semibold uppercase tracking-wide mb-1">{sponsorName}</p>
            )}
            <p className={`font-semibold text-lg leading-snug ${isSponsor ? 'text-gray-900' : 'text-white'}`}>{isSponsor ? itemDesc : item.label}</p>
            {alreadyFound && (
              <p className="text-xs text-brand-magentaVibrant font-medium mt-0.5">Already submitted!</p>
            )}
          </div>

          {/* Sponsor logo — right of text lockup */}
          {isSponsor && logoSrc && !logoFailed && (
            <img src={logoSrc} alt="" aria-hidden="true" onError={() => setLogoFailed(true)} className="flex-shrink-0 h-14 w-auto object-contain max-w-[100px] ml-3 mr-4" />
          )}

          {/* Points badge + found checkmark */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="bg-brand-teal/20 text-brand-teal text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap border border-brand-teal/30">
              {item.points} feathers <FeatherIcon className="w-3 h-3 inline-block" />
            </span>
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

      {/* Upload flow — expanded when camera button tapped */}
      {!isFound && submissionsOpen && uploadOpen && (
        <div className={`px-4 pb-3 ${isSponsor ? 'bg-gray-50 border-t border-black/5' : ''}`}>
          <UploadFlow
            item={item}
            session={session}
            onFound={handleFound}
            onAlreadyFound={handleAlreadyFound}
            onClose={() => setUploadOpen(false)}
            uploading={uploading}
            setUploading={setUploading}
          />
        </div>
      )}
    </div>
  )
}
