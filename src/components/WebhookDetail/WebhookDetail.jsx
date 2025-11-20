'use client';

import { useMemo } from 'react';
import { getMethodColor } from '@/components/EndpointsList/helpers/groupByTags';
import { resolveSchema } from '@/utils/schemaResolver';
import Collapsible from '@/ui/Collapsible/Collapsible';
import './WebhookDetail.scss';

export default function WebhookDetail({ webhook, spec, isSwagger }) {
  const { name, config } = webhook;

  const methods = Object.keys(config).filter(key =>
    ['get', 'post', 'put', 'delete', 'patch'].includes(key.toLowerCase())
  );

  // Render schema as a table
  const renderSchemaTable = (schema) => {
    if (!schema || !schema.properties) {
      return (
        <div className="schema-empty">
          <p>No properties defined</p>
        </div>
      );
    }

    return (
      <table className="schema-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(schema.properties).map(([propName, propSchema]) => {
            const isRequired = schema.required?.includes(propName);
            const type = propSchema.type || 'any';
            const format = propSchema.format ? ` (${propSchema.format})` : '';

            return (
              <tr key={propName}>
                <td><code>{propName}</code></td>
                <td>
                  {type}{format}
                  {propSchema.enum && (
                    <div className="enum-values">
                      enum: [{propSchema.enum.join(', ')}]
                    </div>
                  )}
                </td>
                <td>
                  {isRequired ? (
                    <span className="badge badge--required">Yes</span>
                  ) : (
                    <span className="badge badge--optional">No</span>
                  )}
                </td>
                <td>{propSchema.description || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="webhook-detail">
      <div className="webhook-detail__header">
        <h2>{name}</h2>
      </div>

      {methods.map((method) => {
        const details = config[method];

        // Resolve request body schema
        const requestSchema = useMemo(() => {
          let rawSchema = null;

          if (isSwagger) {
            // Swagger 2.0
            const bodyParam = details.parameters?.find(p => p.in === 'body');
            rawSchema = bodyParam?.schema;
          } else {
            // OpenAPI 3.x
            const requestBody = details.requestBody;
            if (requestBody) {
              const content = requestBody.content || {};
              const jsonContent = content['application/json'];
              rawSchema = jsonContent?.schema;
            }
          }

          if (!rawSchema) return null;
          return resolveSchema(rawSchema, spec, isSwagger);
        }, [details, spec, isSwagger]);

        // Resolve response schemas
        const responseSchemas = useMemo(() => {
          const responses = details.responses || {};
          const result = {};

          Object.entries(responses).forEach(([code, response]) => {
            let rawSchema = null;

            if (isSwagger) {
              // Swagger 2.0
              rawSchema = response.schema;
            } else {
              // OpenAPI 3.x
              const content = response.content || {};
              const jsonContent = content['application/json'];
              rawSchema = jsonContent?.schema;
            }

            result[code] = {
              description: response.description,
              schema: rawSchema ? resolveSchema(rawSchema, spec, isSwagger) : null,
            };
          });

          return result;
        }, [details, spec, isSwagger]);

        return (
          <div key={method} className="webhook-method">
            <div className="webhook-method__header">
              <span className={`method method--${getMethodColor(method.toUpperCase())}`}>
                {method.toUpperCase()}
              </span>
              {details.summary && (
                <h3>{details.summary}</h3>
              )}
            </div>

            {details.description && (
              <p className="webhook-method__description">
                {details.description}
              </p>
            )}

            {/* Request Body */}
            {details.requestBody && (
              <div className="webhook-method__section">
                <h4>Request Body</h4>
                <p className="description">{details.requestBody.description || 'No description'}</p>
                {requestSchema && (
                  <Collapsible title="Schema" defaultOpen={true}>
                    {renderSchemaTable(requestSchema)}
                  </Collapsible>
                )}
                {requestSchema && (
                  <Collapsible title="Raw Schema (JSON)" defaultOpen={false}>
                    <pre className="schema-code">
                      <code>{JSON.stringify(requestSchema, null, 2)}</code>
                    </pre>
                  </Collapsible>
                )}
              </div>
            )}

            {/* Responses */}
            {details.responses && Object.keys(details.responses).length > 0 && (
              <div className="webhook-method__section">
                <h4>Responses</h4>
                {Object.entries(responseSchemas).map(([code, responseData]) => (
                  <div key={code} className="response-item">
                    <div className="response-header">
                      <span className={`status-code status-code--${code.charAt(0)}xx`}>
                        {code}
                      </span>
                      <span className="response-description">
                        {responseData.description || 'No description'}
                      </span>
                    </div>
                    {responseData.schema && (
                      <Collapsible title="Schema" defaultOpen={true}>
                        {renderSchemaTable(responseData.schema)}
                      </Collapsible>
                    )}
                    {responseData.schema && (
                      <Collapsible title="Raw Schema (JSON)" defaultOpen={false}>
                        <pre className="schema-code">
                          <code>{JSON.stringify(responseData.schema, null, 2)}</code>
                        </pre>
                      </Collapsible>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
