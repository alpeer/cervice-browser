'use client';

import { useSpecState } from '@/hooks/useSpecState';
import SidebarPrimary from '@/components/SidebarPrimary/SidebarPrimary';
import SidebarSecondary from '@/components/SidebarSecondary/SidebarSecondary';
import './AppLayout.scss';

export default function AppLayout({ children, showSidebars = false }) {
  const { spec, isValid, selectedSection } = useSpecState();

  // Show sidebars for entities section or when spec is valid
  const shouldShowSidebars = showSidebars || selectedSection === 'entities' || (spec && isValid);

  return (
    <div className="app-container">
      {shouldShowSidebars && <SidebarPrimary />}
      {shouldShowSidebars && <SidebarSecondary />}
      <main className="content">
        {children}
      </main>
    </div>
  );
}
