'use client';

import { useState } from 'react';
import { getMethodColor } from '@/components/EndpointsList/helpers/groupByTags';
import Collapsible from '@/ui/Collapsible/Collapsible';
import Button from '@/ui/Button/Button';
import './EndpointDetail.scss';

export default function EndpointDetail({ endpoint, spec, isSwagger }) {
  const [testResult, setTestResult] = useState(null);
  const { path, method, config } = endpoint;

  const schemas = isSwagger ? spec.definitions : spec.components?.schemas;

  // Extract request schema
  const getRequestSchema = () => {
    if (isSwagger) {
      // Swagger 2.0
      const bodyParam = config.parameters?.find(p => p.in === 'body');
      return bodyParam?.schema;
    } else {
      // OpenAPI 3.x
      const requestBody = config.requestBody;
      if (!requestBody) return null;
      const content = requestBody.content || {};
      const jsonContent = content['application/json'];
      return jsonContent?.schema;
    }
  };

  // Extract response schemas
  const getResponseSchemas = () => {
    const responses = config.responses || {};
    const result = {};

    Object.entries(responses).forEach(([code, response]) => {
      if (isSwagger) {
        // Swagger 2.0
        result[code] = {
          description: response.description,
          schema: response.schema,
        };
      } else {
        // OpenAPI 3.x
        const content = response.content || {};
        const jsonContent = content['application/json'];
        result[code] = {
          description: response.description,
          schema: jsonContent?.schema,
        };
      }
    });

    return result;
  };

  const requestSchema = getRequestSchema();
  const responseSchemas = getResponseSchemas();

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
              {config.parameters.map((param, idx) => (
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
          <Collapsible title="Schema" defaultOpen={true}>
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
            <Collapsible key={code} title={`${code} - ${response.description || 'No description'}`}>
              {response.schema && (
                <pre className="schema-code">
                  <code>{JSON.stringify(response.schema, null, 2)}</code>
                </pre>
              )}
              {!response.schema && (
                <p className="no-schema">No response schema defined</p>
              )}
            </Collapsible>
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
                {requestSchema && ` \\\n  -d '${JSON.stringify({ example: "data" }, null, 2)}'`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
