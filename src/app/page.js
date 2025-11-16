'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import SpecUploader from '@/components/SpecUploader/SpecUploader';
import EndpointsList from '@/components/EndpointsList/EndpointsList';
import ObjectsList from '@/components/ObjectsList/ObjectsList';
import WebhooksList from '@/components/WebhooksList/WebhooksList';
import EntitiesList from '@/components/EntitiesList/EntitiesList';
import { useSpecState } from '@/hooks/useSpecState';
import Button from '@/ui/Button/Button';
import './page.scss';

export default function Home() {
  const [activeView, setActiveView] = useState('endpoints');
  const { spec, version, schemaVersion, isValid, errors, clearSpec } = useSpecState();

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

    switch (activeView) {
      case 'endpoints':
        return <EndpointsList spec={spec} />;
      case 'objects':
        return <ObjectsList spec={spec} />;
      case 'webhooks':
        return <WebhooksList spec={spec} />;
      case 'entities':
        return <EntitiesList spec={spec} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {spec && isValid && <Sidebar onSelect={setActiveView} />}
      <main className="content">
        {spec && isValid && (
          <div className="content__header">
            <div className="spec-info">
              <h1>{spec.info?.title || 'OpenAPI Specification'}</h1>
              <p className="spec-info__version">
                OpenAPI {version} (validated against {schemaVersion})
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
