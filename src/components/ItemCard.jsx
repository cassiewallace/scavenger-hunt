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
      <div className={`flex items-center gap-3 px-4 py-3`}>
        {/* Left slot: media/camera on top, points badge below */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
          {isFound && thumbUrl ? (
            <div className={`w-14 h-14 rounded-lg overflow-hidden ${isSponsor ? 'bg-black/10' : 'bg-white/10'}`}>
              {/\.(mp4|mov|webm|avi)$/i.test(submission.file_path) ? (
                <video src={thumbUrl} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={thumbUrl} alt={item.label} className="w-full h-full object-cover" />
              )}
            </div>
          ) : !isFound && submissionsOpen ? (
            <button
              onClick={() => setUploadOpen(true)}
              className="w-14 h-14 rounded-lg bg-brand-primary flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Submit find"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
                <path d="M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.66-3.56L100.28,48h55.43l13.63,20.44A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z" />
              </svg>
            </button>
          ) : null}

          {/* Points badge — teal with feather when pending, green with check when found */}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap border flex items-center gap-1 ${
            isFound
              ? 'bg-brand-success/20 text-brand-success border-brand-success/30'
              : 'bg-brand-teal/20 text-brand-teal border-brand-teal/30'
          }`}>
            {item.points}
            {isFound ? (
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
                <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
              </svg>
            ) : (
              <FeatherIcon className="w-3 h-3 flex-shrink-0" />
            )}
          </span>
        </div>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          {isSponsor && (
            logoSrc && !logoFailed ? (
              <img
                src={logoSrc}
                alt={sponsorName}
                onError={() => setLogoFailed(true)}
                className="h-10 w-auto object-contain max-w-[140px] mb-2"
              />
            ) : (
              <p className="text-black/50 text-xs font-semibold uppercase tracking-wide mb-1">{sponsorName}</p>
            )
          )}
          <p className={`font-semibold text-lg leading-snug ${isSponsor ? 'text-gray-900' : 'text-white'}`}>{isSponsor ? itemDesc : item.label}</p>
          {alreadyFound && (
            <p className="text-xs text-brand-magentaVibrant font-medium mt-0.5">Already submitted!</p>
          )}
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
            isSponsor={isSponsor}
          />
        </div>
      )}
    </div>
  )
}
