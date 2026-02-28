import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Hunt from './pages/Hunt'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'

export default function App() {
  const [submissionsOpen, setSubmissionsOpen] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
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

  const session = JSON.parse(localStorage.getItem('vntrbirds_session') || 'null')

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing is always the root — it's the main hub with leaderboard */}
        <Route path="/" element={<Landing />} />

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
          element={
            session
              ? <Hunt submissionsOpen={submissionsOpen} />
              : <Navigate to="/" replace />
          }
        />
        <Route path="/leaderboard" element={<Leaderboard session={session} />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
