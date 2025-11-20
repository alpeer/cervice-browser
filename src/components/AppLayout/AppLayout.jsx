'use client'

import clsx from 'clsx'
import { useSpecState } from '@/hooks/useSpecState'
import SidebarPrimary from '@/components/SidebarPrimary/SidebarPrimary'
import SidebarSecondary from '@/components/SidebarSecondary/SidebarSecondary'
import ToastContainer from '@/components/ToastContainer/ToastContainer'
import styles from './AppLayout.module.scss'

export default function AppLayout({ children, showSidebars = false }) {
  const { spec, isValid, selectedSection } = useSpecState()

  // Show sidebars for entities section or when spec is valid
  const shouldShowSidebars = showSidebars || selectedSection === 'entities' || (spec && isValid)

  return (
    <div className={styles.appContainer}>
      {shouldShowSidebars && <SidebarPrimary />}
      {selectedSection && shouldShowSidebars && <SidebarSecondary />}
      <main className={styles.content}>
        {children}
      </main>
      <ToastContainer />
    </div>
  )
}
