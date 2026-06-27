import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { NavRail } from './NavRail'
import { LiveFlightPiP } from '../ui/LiveFlightPiP'

export function Shell() {
  return (
    <div style={{ display:'flex', flexDirection:'column', width:'100%', height:'100vh', overflow:'hidden' }}>
      <Topbar />
      <div style={{ display:'flex', flex:'1 1 0', minHeight:0, overflow:'hidden' }}>
        <NavRail />
        <main style={{ flex:'1 1 0', minWidth:0, minHeight:0, overflow:'hidden', position:'relative' }}>
          <Outlet />
        </main>
      </div>
      {/* Floating live flight tracker — visible on every page */}
      <LiveFlightPiP />
    </div>
  )
}
