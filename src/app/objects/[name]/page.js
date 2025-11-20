'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSpecState } from '@/hooks/useSpecState';
import { getSchemas, getDomainModels } from '@/utils/specUtils';
import AppLayout from '@/components/AppLayout/AppLayout';
import ObjectDetail from '@/components/ObjectDetail/ObjectDetail';
import Button from '@/ui/Button/Button';
import styles from '../../page.module.scss';

export default function ObjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const objectName = decodeURIComponent(params.name);

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

  const domainModels = useMemo(() => {
    if (!spec) return {};
    const allSchemas = getSchemas(spec, isSwagger);
    return getDomainModels(allSchemas);
  }, [spec, isSwagger]);

  const selectedObject = useMemo(() => {
    const schema = domainModels[objectName];
    if (!schema) return null;
    return { name: objectName, schema, type: 'object' };
  }, [domainModels, objectName]);

  // Configure sidebars
  useEffect(() => {
    if (selectedSection !== 'objects') {
      setSelectedSection('objects');
    }

    if (!spec) return;

    const objectNames = Object.keys(domainModels).sort();

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
        active: true,
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
        onClick: () => router.push('/entities'),
      },
    ];

    setSidebarPrimary(primaryItems);

    // Configure secondary sidebar with objects
    const secondaryItems = objectNames.map(name => {
      const schema = domainModels[name];
      const propertyCount = schema.properties ? Object.keys(schema.properties).length : 0;
      return {
        id: name,
        label: name,
        subtitle: `${propertyCount} properties`,
        selected: name === objectName,
        onClick: () => router.push(`/objects/${encodeURIComponent(name)}`),
      };
    });

    setSidebarSecondary('Objects', `${objectNames.length} objects`, secondaryItems);

    // Set selected item
    if (selectedObject && (!selectedItem || selectedItem.name !== objectName)) {
      setSelectedItem(selectedObject);
    }
  }, [spec, domainModels, objectName, selectedObject, selectedSection, selectedItem, setSelectedSection, setSelectedItem, setSidebarPrimary, setSidebarSecondary, router]);

  if (!spec || !isValid) {
    router.push('/endpoints');
    return null;
  }

  if (!selectedObject) {
    return (
      <AppLayout showSidebars>
        <div className={styles.header}>
          <div className={styles.specInfo}>
            <h1>{spec.info?.title || 'OpenAPI Specification'}</h1>
            <p className={styles.version}>
              {isSwagger ? 'Swagger' : 'OpenAPI'} {version}
              {schemaVersion && version !== schemaVersion && ` (validated against ${schemaVersion})`}
            </p>
          </div>
          <Button onClick={clearSpec} variant="outlined" size="small">
            Change Spec
          </Button>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.content}>
            <h2>Object not found: {objectName}</h2>
            <p>This object doesn't exist in the specification</p>
          </div>
        </div>
      </AppLayout>
    );
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
      <ObjectDetail object={selectedObject} />
    </AppLayout>
  );
}
