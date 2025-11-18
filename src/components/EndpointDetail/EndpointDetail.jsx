'use client';

import { useMemo } from 'react';
import { getMethodColor } from '@/components/EndpointsList/helpers/groupByTags';
import { resolveSchema, buildExample } from '@/utils/schemaResolver';
import Collapsible from '@/ui/Collapsible/Collapsible';
import './EndpointDetail.scss';

export default function EndpointDetail({ endpoint, spec, isSwagger }) {
  const { path, method, config } = endpoint;

  // Extract and resolve request schema
  const requestSchema = useMemo(() => {
    let rawSchema = null;

    if (isSwagger) {
      // Swagger 2.0
      const bodyParam = config.parameters?.find(p => p.in === 'body');
      rawSchema = bodyParam?.schema;
    } else {
      // OpenAPI 3.x
      const requestBody = config.requestBody;
      if (requestBody) {
        const content = requestBody.content || {};
        const jsonContent = content['application/json'];
        rawSchema = jsonContent?.schema;
      }
    }

    if (!rawSchema) return null;

    return resolveSchema(rawSchema, spec, isSwagger);
  }, [config, spec, isSwagger]);

  // Extract and resolve response schemas
  const responseSchemas = useMemo(() => {
    const responses = config.responses || {};
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
  }, [config, spec, isSwagger]);

  // Render schema as a table
  const renderSchemaTable = (schema) => {
    if (!schema || !schema.properties) {
      return null;
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
    <div className="endpoint-detail">
      <div className="endpoint-detail__header">
        <div className="endpoint-detail__title">
          <span className={`method method--${getMethodColor(method)}`}>
            {method}
          </span>
          <h2>{path}</h2>
        </div>
        {config.deprecated && (
          <span className="deprecated-badge">DEPRECATED</span>
        )}
      </div>

      {config.summary && (
        <p className="endpoint-detail__summary">{config.summary}</p>
      )}

      {config.description && (
        <div className="endpoint-detail__description">
          <h3>Description</h3>
          <p>{config.description}</p>
        </div>
      )}

      {/* Parameters */}
      {config.parameters && config.parameters.length > 0 && (
        <div className="endpoint-detail__section">
          <h3>Parameters</h3>
          <table className="params-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>In</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {config.parameters.filter(p => p.in !== 'body').map((param, idx) => (
                <tr key={idx}>
                  <td><code>{param.name}</code></td>
                  <td><span className="badge">{param.in}</span></td>
                  <td>{param.type || param.schema?.type || 'N/A'}</td>
                  <td>
                    {param.required ? (
                      <span className="badge badge--required">Yes</span>
                    ) : (
                      <span className="badge badge--optional">No</span>
                    )}
                  </td>
                  <td>{param.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Body Schema */}
      {requestSchema && (
        <div className="endpoint-detail__section">
          <h3>Request Body</h3>
          <Collapsible title="Schema Structure" defaultOpen={true}>
            {renderSchemaTable(requestSchema)}
          </Collapsible>
          <Collapsible title="Example JSON" defaultOpen={false}>
            <pre className="schema-code">
              <code>{JSON.stringify(buildExample(requestSchema), null, 2)}</code>
            </pre>
          </Collapsible>
          <Collapsible title="Full Schema (JSON)" defaultOpen={false}>
            <pre className="schema-code">
              <code>{JSON.stringify(requestSchema, null, 2)}</code>
            </pre>
          </Collapsible>
        </div>
      )}

      {/* Responses */}
      {Object.keys(responseSchemas).length > 0 && (
        <div className="endpoint-detail__section">
          <h3>Responses</h3>
          {Object.entries(responseSchemas).map(([code, response]) => (
            <div key={code} className="response-section">
              <h4 className="response-code">
                <span className={`status-badge status-${code[0]}xx`}>{code}</span>
                {response.description}
              </h4>
              {response.schema ? (
                <>
                  <Collapsible title="Schema Structure" defaultOpen={code === '200'}>
                    {renderSchemaTable(response.schema)}
                  </Collapsible>
                  <Collapsible title="Example JSON" defaultOpen={false}>
                    <pre className="schema-code">
                      <code>{JSON.stringify(buildExample(response.schema), null, 2)}</code>
                    </pre>
                  </Collapsible>
                  <Collapsible title="Full Schema (JSON)" defaultOpen={false}>
                    <pre className="schema-code">
                      <code>{JSON.stringify(response.schema, null, 2)}</code>
                    </pre>
                  </Collapsible>
                </>
              ) : (
                <p className="no-schema">No response schema defined</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Test Form */}
      <div className="endpoint-detail__section">
        <h3>Test Endpoint</h3>
        <div className="test-form">
          <p className="test-form__note">
            Testing functionality will be implemented in a future update.
            For now, use tools like Postman or curl to test this endpoint.
          </p>
          <div className="test-form__example">
            <h4>Example with curl:</h4>
            <pre className="curl-example">
              <code>
                curl -X {method} \{'\n'}
                  "{path}" \{'\n'}
                  -H "Content-Type: application/json"
                {requestSchema && ` \\\n  -d '${JSON.stringify(buildExample(requestSchema), null, 2)}'`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
