'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSpecState } from '@/hooks/useSpecState';
import { getWebhooks } from '@/utils/specUtils';
import AppLayout from '@/components/AppLayout/AppLayout';
import WebhookDetail from '@/components/WebhookDetail/WebhookDetail';
import Button from '@/ui/Button/Button';

export default function WebhookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const webhookName = decodeURIComponent(params.name);

  const {
    spec,
    isValid,
    isSwagger,
    version,
    schemaVersion,
    selectedSection,
    selectedItem,
    setSelectedSection,
    setSelectedItem,
    setSidebarPrimary,
    setSidebarSecondary,
    clearSpec,
  } = useSpecState();

  const webhooks = useMemo(() => {
    if (!spec) return {};
    return getWebhooks(spec, isSwagger);
  }, [spec, isSwagger]);

  const selectedWebhook = useMemo(() => {
    const config = webhooks[webhookName];
    if (!config) return null;
    return { id: webhookName, name: webhookName, config };
  }, [webhooks, webhookName]);

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
        selected: name === webhookName,
        onClick: () => router.push(`/webhooks/${encodeURIComponent(name)}`),
      };
    });

    setSidebarSecondary('WebHooks', `${webhookNames.length} webhooks`, secondaryItems);

    // Set selected item
    if (selectedWebhook && (!selectedItem || selectedItem.name !== webhookName)) {
      setSelectedItem(selectedWebhook);
    }
  }, [spec, webhooks, webhookName, selectedWebhook, selectedSection, selectedItem, setSelectedSection, setSelectedItem, setSidebarPrimary, setSidebarSecondary, router]);

  if (!spec || !isValid) {
    router.push('/endpoints');
    return null;
  }

  if (!selectedWebhook) {
    return (
      <AppLayout showSidebars>
        <div className="content__header">
          <div className="spec-info">
            <h1>{spec.info?.title || 'OpenAPI Specification'}</h1>
            <p className="spec-info__version">
              {isSwagger ? 'Swagger' : 'OpenAPI'} {version}
              {schemaVersion && version !== schemaVersion && ` (validated against ${schemaVersion})`}
            </p>
          </div>
          <Button onClick={clearSpec} variant="outlined" size="small">
            Change Spec
          </Button>
        </div>
        <div className="empty-state">
          <div className="empty-state__content">
            <h2>Webhook not found: {webhookName}</h2>
            <p>This webhook doesn't exist in the specification</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showSidebars>
      <div className="content__header">
        <div className="spec-info">
          <h1>{spec.info?.title || 'OpenAPI Specification'}</h1>
          <p className="spec-info__version">
            {isSwagger ? 'Swagger' : 'OpenAPI'} {version}
            {schemaVersion && version !== schemaVersion && ` (validated against ${schemaVersion})`}
          </p>
          {spec.info?.description && (
            <p className="spec-info__description">{spec.info.description}</p>
          )}
        </div>
        <Button onClick={clearSpec} variant="outlined" size="small">
          Change Spec
        </Button>
      </div>
      <WebhookDetail webhook={selectedWebhook} />
    </AppLayout>
  );
}
