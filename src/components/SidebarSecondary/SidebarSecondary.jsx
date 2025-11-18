'use client';

import { List, ListItemButton, ListItemText } from '@mui/material';
import { useSpecState } from '@/hooks/useSpecState';
import { getPaths, getSchemas, getWebhooks, getDomainModels } from '@/utils/specUtils';
import { groupByTags, getMethodColor } from '@/components/EndpointsList/helpers/groupByTags';
import './SidebarSecondary.scss';

export default function SidebarSecondary() {
  const {
    spec,
    isSwagger,
    selectedSection,
    selectedTag,
    selectedItem,
    setSelectedItem,
  } = useSpecState();

  // Don't show if no tag/category is selected
  if (!spec || !selectedTag) return null;

  const renderItems = () => {
    switch (selectedSection) {
      case 'endpoints': {
        const paths = getPaths(spec);
        const grouped = groupByTags(paths);
        const endpoints = grouped[selectedTag] || [];

        return (
          <>
            <div className="sidebar-secondary__header">
              <h4>{selectedTag}</h4>
              <span className="sidebar-secondary__count">{endpoints.length} endpoints</span>
            </div>
            <List className="sidebar-secondary__list">
              {endpoints.map((endpoint, idx) => (
                <ListItemButton
                  key={idx}
                  className={`sidebar-secondary__item ${
                    selectedItem?.id === endpoint.operationId || selectedItem?.path === endpoint.path && selectedItem?.method === endpoint.method
                      ? 'sidebar-secondary__item--selected'
                      : ''
                  }`}
                  onClick={() => setSelectedItem({...endpoint, id: endpoint.operationId || `${endpoint.method}_${endpoint.path}`})}
                >
                  <div className="sidebar-secondary__item-content">
                    <span className={`method-badge method-badge--${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <span className="endpoint-path">{endpoint.path}</span>
                  </div>
                  {endpoint.summary && (
                    <div className="endpoint-summary">{endpoint.summary}</div>
                  )}
                </ListItemButton>
              ))}
            </List>
          </>
        );
      }

      case 'objects': {
        const allSchemas = getSchemas(spec, isSwagger);
        const domainModels = getDomainModels(allSchemas);

        // If special tag '__all_objects__', show list of all objects
        if (selectedTag === '__all_objects__') {
          const objectNames = Object.keys(domainModels).sort();

          return (
            <>
              <div className="sidebar-secondary__header">
                <h4>Objects</h4>
                <span className="sidebar-secondary__count">{objectNames.length} objects</span>
              </div>
              <List className="sidebar-secondary__list">
                {objectNames.map((name) => {
                  const schema = domainModels[name];
                  const propertyCount = schema.properties ? Object.keys(schema.properties).length : 0;

                  return (
                    <ListItemButton
                      key={name}
                      className={`sidebar-secondary__item ${
                        selectedItem?.name === name ? 'sidebar-secondary__item--selected' : ''
                      }`}
                      onClick={() => setSelectedItem({ name, schema, type: 'object' })}
                    >
                      <div className="object-name">{name}</div>
                      <div className="object-meta">{propertyCount} properties</div>
                    </ListItemButton>
                  );
                })}
              </List>
            </>
          );
        }

        // Show properties of a specific selected object (legacy - may not be used now)
        const schema = domainModels[selectedTag];
        if (!schema) return null;

        const properties = schema.properties ? Object.keys(schema.properties) : [];

        return (
          <>
            <div className="sidebar-secondary__header">
              <h4>{selectedTag}</h4>
              <span className="sidebar-secondary__count">{properties.length} properties</span>
            </div>
            <div className="sidebar-secondary__details">
              {schema.description && (
                <p className="object-description">{schema.description}</p>
              )}
              <List className="sidebar-secondary__list">
                {properties.map((propName) => {
                  const prop = schema.properties[propName];
                  const isRequired = schema.required?.includes(propName);

                  return (
                    <div key={propName} className="property-item">
                      <div className="property-name">
                        <code>{propName}</code>
                        {isRequired && <span className="required-badge">required</span>}
                      </div>
                      <div className="property-type">{prop.type || 'any'}</div>
                    </div>
                  );
                })}
              </List>
            </div>
          </>
        );
      }

      case 'webhooks': {
        const webhooks = getWebhooks(spec, isSwagger);
        const webhook = webhooks[selectedTag];

        if (!webhook) return null;

        const methods = Object.keys(webhook).filter(key =>
          ['get', 'post', 'put', 'delete', 'patch'].includes(key.toLowerCase())
        );

        return (
          <>
            <div className="sidebar-secondary__header">
              <h4>{selectedTag}</h4>
              <span className="sidebar-secondary__count">{methods.length} methods</span>
            </div>
            <List className="sidebar-secondary__list">
              {methods.map((method) => (
                <ListItemButton
                  key={method}
                  className="sidebar-secondary__item"
                  onClick={() => setSelectedItem({ id: selectedTag, name: selectedTag, method, config: webhook[method] })}
                >
                  <div className="sidebar-secondary__item-content">
                    <span className={`method-badge method-badge--${getMethodColor(method.toUpperCase())}`}>
                      {method.toUpperCase()}
                    </span>
                    <span className="endpoint-path">{webhook[method].summary || 'Webhook'}</span>
                  </div>
                </ListItemButton>
              ))}
            </List>
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <nav className="sidebar-secondary">
      {renderItems()}
    </nav>
  );
}
