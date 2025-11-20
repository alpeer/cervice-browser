'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSpecState } from '@/hooks/useSpecState';
import { getWebhooks } from '@/utils/specUtils';
import AppLayout from '@/components/AppLayout/AppLayout';
import Button from '@/ui/Button/Button';
import styles from '../page.module.scss';

export default function WebhooksPage() {
  const router = useRouter();
  const {
    spec,
    isValid,
    isSwagger,
    version,
    schemaVersion,
    selectedSection,
    setSelectedSection,
    setSidebarPrimary,
    setSidebarSecondary,
    clearSpec,
  } = useSpecState();

  const webhooks = useMemo(() => {
    if (!spec) return {};
    return getWebhooks(spec, isSwagger);
  }, [spec, isSwagger]);

  // Configure sidebars
  useEffect(() => {
    if (selectedSection !== 'webhooks') {
      setSelectedSection('webhooks');
    }

    if (!spec) return;

    const webhookNames = Object.keys(webhooks).sort();

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
        active: true,
        onClick: () => router.push('/webhooks'),
      },
      {
        id: 'entities',
        label: 'Entities',
        collapsible: false,
        onClick: () => router.push('/entities'),
      },
    ];

    setSidebarPrimary(primaryItems);

    // Configure secondary sidebar with webhooks
    const secondaryItems = webhookNames.map(name => {
      const webhook = webhooks[name];
      const methods = Object.keys(webhook).filter(key =>
        ['get', 'post', 'put', 'delete', 'patch'].includes(key.toLowerCase())
      );
      return {
        id: name,
        label: name,
        subtitle: `${methods.length} methods`,
        onClick: () => router.push(`/webhooks/${encodeURIComponent(name)}`),
      };
    });

    setSidebarSecondary('WebHooks', `${webhookNames.length} webhooks`, secondaryItems);
  }, [spec, webhooks, selectedSection, setSelectedSection, setSidebarPrimary, setSidebarSecondary, router]);

  if (!spec || !isValid) {
    router.push('/endpoints');
    return null;
  }

  return (
    <AppLayout showSidebars>
      <div className={styles.header}>
        <div className={styles.specInfo}>
          <h1>{spec.info?.title || 'OpenAPI Specification'}</h1>
          <p className={styles.version}>
            {isSwagger ? 'Swagger' : 'OpenAPI'} {version}
            {schemaVersion && version !== schemaVersion && ` (validated against ${schemaVersion})`}
          </p>
          {spec.info?.description && (
            <p className={styles.description}>{spec.info.description}</p>
          )}
        </div>
        <Button onClick={clearSpec} variant="outlined" size="small">
          Change Spec
        </Button>
      </div>
      <div className={styles.emptyState}>
        <div className={styles.content}>
          <h2>Select a webhook from the sidebar</h2>
          <p>Choose a webhook to view its details</p>
        </div>
      </div>
    </AppLayout>
  );
}
