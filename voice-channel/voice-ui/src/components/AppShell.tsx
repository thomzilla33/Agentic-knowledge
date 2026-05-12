import { type ReactNode } from 'react'
import { Topbar } from './Topbar'
import { Tooltip } from './Tooltip'
import { type AppId } from '../data/apps'
import '../styles/shell.css'

interface AppShellProps {
  children: ReactNode
  currentAppId: AppId
}

/**
 * Root layout for the AIMS platform shell.
 *
 * Renders the fixed topbar (workspace context menu + global search +
 * right-side icons + AI Assistant trigger), the global tooltip
 * provider, and the active studio content inside `<main>`.
 */
export function AppShell({ children, currentAppId }: AppShellProps) {
  return (
    <>
      <Topbar currentAppId={currentAppId} />
      <main className="app-main">{children}</main>
      <Tooltip />
    </>
  )
}
