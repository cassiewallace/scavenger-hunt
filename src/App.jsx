import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Hunt from './pages/Hunt'
import Admin from './pages/Admin'

export default function App() {
  const [submissionsOpen, setSubmissionsOpen] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('leave')) {
      localStorage.removeItem('vntrbirds_session')
      window.location.replace('/')
      return
    }

    // Initial fetch of submissions_open setting
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'submissions_open')
      .single()
      .then(({ data }) => {
        if (data) setSubmissionsOpen(data.value === 'true')
        setSettingsLoaded(true)
      })

    // Realtime subscription for live toggle
    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: 'key=eq.submissions_open' },
        (payload) => {
          if (payload.new?.value !== undefined) {
            setSubmissionsOpen(payload.new.value === 'true')
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing is always the root — it's the main hub with leaderboard */}
        <Route path="/" element={<Landing submissionsOpen={submissionsOpen} settingsLoaded={settingsLoaded} />} />

        <Route
          path="/register"
          element={
            !submissionsOpen && settingsLoaded
              ? <Navigate to="/" state={{ closed: true }} replace />
              : <Register />
          }
        />
        <Route
          path="/hunt"
          element={<Hunt submissionsOpen={submissionsOpen} />}
        />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
