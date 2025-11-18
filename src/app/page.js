'use client';

import SidebarPrimary from '@/components/SidebarPrimary/SidebarPrimary';
import SidebarSecondary from '@/components/SidebarSecondary/SidebarSecondary';
import SpecUploader from '@/components/SpecUploader/SpecUploader';
import EndpointDetail from '@/components/EndpointDetail/EndpointDetail';
import ObjectDetail from '@/components/ObjectDetail/ObjectDetail';
import WebhookDetail from '@/components/WebhookDetail/WebhookDetail';
import EntitiesList from '@/components/EntitiesList/EntitiesList';
import { useSpecState } from '@/hooks/useSpecState';
import Button from '@/ui/Button/Button';
import './page.scss';

export default function Home() {
  const { spec, version, schemaVersion, isSwagger, isValid, errors, selectedSection, selectedItem, clearSpec } = useSpecState();

  const renderContent = () => {
    if (!spec) {
      return <SpecUploader />;
    }

    if (!isValid) {
      return (
        <div className="validation-errors">
          <h2>Validation Errors</h2>
          <p>Your spec has validation errors:</p>
          <ul>
            {errors.map((error, idx) => (
              <li key={idx}>
                <strong>{error.path || 'root'}:</strong> {error.message}
              </li>
            ))}
          </ul>
          <Button onClick={clearSpec} variant="outlined">
            Upload Different Spec
          </Button>
        </div>
      );
    }

    // No item selected - show empty state
    if (!selectedItem && selectedSection !== 'entities') {
      return (
        <div className="empty-state">
          <div className="empty-state__content">
            <h2>Select an item from the sidebar</h2>
            <p>Choose an endpoint, object, or webhook to view its details</p>
          </div>
        </div>
      );
    }

    // Show detail view based on selected section and item
    switch (selectedSection) {
      case 'endpoints':
        return selectedItem ? <EndpointDetail endpoint={selectedItem} spec={spec} isSwagger={isSwagger} /> : null;

      case 'objects':
        return selectedItem ? <ObjectDetail object={selectedItem} /> : null;

      case 'webhooks':
        return selectedItem ? <WebhookDetail webhook={selectedItem} /> : null;

      case 'entities':
        return <EntitiesList />;

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {spec && isValid && <SidebarPrimary />}
      {spec && isValid && <SidebarSecondary />}
      <main className="content">
        {spec && isValid && (
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
        )}
        {renderContent()}
      </main>
    </div>
  );
}
