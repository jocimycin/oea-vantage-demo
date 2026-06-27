import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { Dashboard }  from './pages/Dashboard'
import { Flights }    from './pages/Flights'
import { Facilities } from './pages/Facilities'
import { DropSites }  from './pages/DropSites'
import { Nests }      from './pages/Nests'
import { Airspace }   from './pages/Airspace'
import { Weather }    from './pages/Weather'
import { Fleet }      from './pages/Fleet'
import { Analytics }  from './pages/Analytics'
import { Permits }    from './pages/Permits'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />}  />
          <Route path="flights"    element={<Flights />}    />
          <Route path="facilities" element={<Facilities />} />
          <Route path="drop-sites" element={<DropSites />}  />
          <Route path="nests"      element={<Nests />}      />
          <Route path="airspace"   element={<Airspace />}   />
          <Route path="weather"    element={<Weather />}    />
          <Route path="fleet"      element={<Fleet />}      />
          <Route path="analytics"  element={<Analytics />}  />
          <Route path="permits"    element={<Permits />}    />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
