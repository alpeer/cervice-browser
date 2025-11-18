'use client';

import SidebarPrimary from '@/components/SidebarPrimary/SidebarPrimary';
import SidebarSecondary from '@/components/SidebarSecondary/SidebarSecondary';
import SpecUploader from '@/components/SpecUploader/SpecUploader';
import EndpointDetail from '@/components/EndpointDetail/EndpointDetail';
import ObjectDetail from '@/components/ObjectDetail/ObjectDetail';
import WebhookDetail from '@/components/WebhookDetail/WebhookDetail';
import EntityDetail from '@/components/EntityDetail/EntityDetail';
import { useSpecState } from '@/hooks/useSpecState';
import Button from '@/ui/Button/Button';
import './page.scss';

export default function Home() {
  const { spec, version, schemaVersion, isSwagger, isValid, errors, selectedSection, selectedItem, setSelectedSection, clearSpec } = useSpecState();

  const renderContent = () => {
    // Entities section doesn't require spec
    if (selectedSection === 'entities') {
      return <EntityDetail />;
    }

    if (!spec) {
      return (
        <div className="spec-uploader-container">
          <SpecUploader />
          <div className="or-divider">
            <span>OR</span>
          </div>
          <Button
            onClick={() => setSelectedSection('entities')}
            variant="outlined"
            size="large"
          >
            Go to Entity Diagram
          </Button>
        </div>
      );
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
    if (!selectedItem) {
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
        return <EndpointDetail endpoint={selectedItem} spec={spec} isSwagger={isSwagger} />;

      case 'objects':
        return <ObjectDetail object={selectedItem} />;

      case 'webhooks':
        return <WebhookDetail webhook={selectedItem} />;

      default:
        return null;
    }
  };

  // Show sidebars for entities section or when spec is valid
  const showSidebars = selectedSection === 'entities' || (spec && isValid);

  return (
    <div className="app-container">
      {showSidebars && <SidebarPrimary />}
      {showSidebars && <SidebarSecondary />}
      <main className="content">
        {spec && isValid && selectedSection !== 'entities' && (
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
