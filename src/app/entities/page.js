'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpecState } from '@/hooks/useSpecState';
import AppLayout from '@/components/AppLayout/AppLayout';
import EntityDetail from '@/components/EntityDetail/EntityDetail';

export default function EntitiesPage() {
  const router = useRouter();
  const {
    entities,
    selectedSection,
    setSelectedSection,
    setSidebarPrimary,
    setSidebarSecondary,
    setFocusedEntity,
    setSelectedItem,
  } = useSpecState();

  // Configure sidebars
  useEffect(() => {
    if (selectedSection !== 'entities') {
      setSelectedSection('entities');
    }

    // Configure primary sidebar
    const primaryItems = [
      {
        id: 'endpoints',
        label: 'Endpoints',
        collapsible: false,
        onClick: () => router.push('/endpoints'),
      },
      {
        id: 'objects',
        label: 'Objects',
        collapsible: false,
        onClick: () => router.push('/objects'),
      },
      {
        id: 'webhooks',
        label: 'WebHooks',
        collapsible: false,
        onClick: () => router.push('/webhooks'),
      },
      {
        id: 'entities',
        label: 'Entities',
        collapsible: false,
        active: true,
        onClick: () => router.push('/entities'),
      },
    ];

    setSidebarPrimary(primaryItems);

    // Configure secondary sidebar with entity list
    const entityList = Object.values(entities);
    const secondaryItems = entityList.map(entity => ({
      id: entity.name,
      label: entity.name,
      subtitle: `${entity.columns?.length || 0} columns${entity.indexes?.length > 0 ? `, ${entity.indexes.length} indexes` : ''}`,
      onClick: () => {
        setSelectedItem({ name: entity.name, type: 'entity' });
        // Center entity in React Flow viewport
        if (typeof window !== 'undefined' && window.centerEntityInFlow) {
          window.centerEntityInFlow(entity.name);
        }
      },
      onMouseEnter: () => setFocusedEntity(entity.name),
      onMouseLeave: () => setFocusedEntity(null),
    }));

    setSidebarSecondary('Entities', `${entityList.length} entities`, secondaryItems);
  }, [entities, selectedSection, setSelectedSection, setSidebarPrimary, setSidebarSecondary, setFocusedEntity, setSelectedItem, router]);

  return (
    <AppLayout showSidebars>
      <EntityDetail />
    </AppLayout>
  );
}
