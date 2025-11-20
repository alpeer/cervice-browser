'use client';

import { useMemo } from 'react';
import { getMethodColor } from '@/components/EndpointsList/helpers/groupByTags';
import { resolveSchema, buildExample } from '@/utils/schemaResolver';
import Collapsible from '@/ui/Collapsible/Collapsible';
import clsx from 'clsx';
import styles from './EndpointDetail.module.scss';

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
      <table className={styles.schemaTable}>
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
                    <div className={styles.enumValues}>
                      enum: [{propSchema.enum.join(', ')}]
                    </div>
                  )}
                </td>
                <td>
                  {isRequired ? (
                    <span className={clsx(styles.badge, styles.badgeRequired)}>Yes</span>
                  ) : (
                    <span className={clsx(styles.badge, styles.badgeOptional)}>No</span>
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
    <div className={styles.endpointDetail}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={clsx(styles.method, styles[`method${getMethodColor(method).charAt(0).toUpperCase() + getMethodColor(method).slice(1)}`])}>
            {method}
          </span>
          <h2>{path}</h2>
        </div>
        {config.deprecated && (
          <span className={styles.deprecatedBadge}>DEPRECATED</span>
        )}
      </div>

      {config.summary && (
        <p className={styles.summary}>{config.summary}</p>
      )}

      {config.description && (
        <div className={styles.description}>
          <h3>Description</h3>
          <p>{config.description}</p>
        </div>
      )}

      {/* Parameters */}
      {config.parameters && config.parameters.length > 0 && (
        <div className={styles.section}>
          <h3>Parameters</h3>
          <table className={styles.paramsTable}>
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
                  <td><span className={styles.badge}>{param.in}</span></td>
                  <td>{param.type || param.schema?.type || 'N/A'}</td>
                  <td>
                    {param.required ? (
                      <span className={clsx(styles.badge, styles.badgeRequired)}>Yes</span>
                    ) : (
                      <span className={clsx(styles.badge, styles.badgeOptional)}>No</span>
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
        <div className={styles.section}>
          <h3>Request Body</h3>
          <Collapsible title="Schema Structure" defaultOpen={true}>
            {renderSchemaTable(requestSchema)}
          </Collapsible>
          <Collapsible title="Example JSON" defaultOpen={false}>
            <pre className={styles.schemaCode}>
              <code>{JSON.stringify(buildExample(requestSchema), null, 2)}</code>
            </pre>
          </Collapsible>
          <Collapsible title="Full Schema (JSON)" defaultOpen={false}>
            <pre className={styles.schemaCode}>
              <code>{JSON.stringify(requestSchema, null, 2)}</code>
            </pre>
          </Collapsible>
        </div>
      )}

      {/* Responses */}
      {Object.keys(responseSchemas).length > 0 && (
        <div className={styles.section}>
          <h3>Responses</h3>
          {Object.entries(responseSchemas).map(([code, response]) => (
            <div key={code} className={styles.responseSection}>
              <h4 className={styles.responseCode}>
                <span className={clsx(styles.statusBadge, styles[`status${code[0]}xx`])}>{code}</span>
                {response.description}
              </h4>
              {response.schema ? (
                <>
                  <Collapsible title="Schema Structure" defaultOpen={code === '200'}>
                    {renderSchemaTable(response.schema)}
                  </Collapsible>
                  <Collapsible title="Example JSON" defaultOpen={false}>
                    <pre className={styles.schemaCode}>
                      <code>{JSON.stringify(buildExample(response.schema), null, 2)}</code>
                    </pre>
                  </Collapsible>
                  <Collapsible title="Full Schema (JSON)" defaultOpen={false}>
                    <pre className={styles.schemaCode}>
                      <code>{JSON.stringify(response.schema, null, 2)}</code>
                    </pre>
                  </Collapsible>
                </>
              ) : (
                <p className={styles.noSchema}>No response schema defined</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Test Form */}
      <div className={styles.section}>
        <h3>Test Endpoint</h3>
        <div className={styles.testForm}>
          <p className={styles.testFormNote}>
            Testing functionality will be implemented in a future update.
            For now, use tools like Postman or curl to test this endpoint.
          </p>
          <div className={styles.testFormExample}>
            <h4>Example with curl:</h4>
            <pre className={styles.curlExample}>
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
