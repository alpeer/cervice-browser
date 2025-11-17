'use client';

import { getMethodColor } from '@/components/EndpointsList/helpers/groupByTags';
import Collapsible from '@/ui/Collapsible/Collapsible';
import './WebhookDetail.scss';

export default function WebhookDetail({ webhook }) {
  const { label, config } = webhook;

  const methods = Object.keys(config).filter(key =>
    ['get', 'post', 'put', 'delete', 'patch'].includes(key.toLowerCase())
  );

  return (
    <div className="webhook-detail">
      <div className="webhook-detail__header">
        <h2>{label}</h2>
      </div>

      {methods.map((method) => {
        const details = config[method];
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

            {details.requestBody && (
              <div className="webhook-method__section">
                <h4>Request Body</h4>
                <p className="description">{details.requestBody.description || 'No description'}</p>
                {details.requestBody.content && (
                  <Collapsible title="Schema" defaultOpen={false}>
                    <pre className="schema-code">
                      <code>{JSON.stringify(details.requestBody.content, null, 2)}</code>
                    </pre>
                  </Collapsible>
                )}
              </div>
            )}

            {details.responses && (
              <div className="webhook-method__section">
                <h4>Responses</h4>
                {Object.entries(details.responses).map(([code, response]) => (
                  <div key={code} className="response-item">
                    <strong>{code}:</strong> {response.description || 'No description'}
                    {response.content && (
                      <Collapsible title="Schema" defaultOpen={false}>
                        <pre className="schema-code">
                          <code>{JSON.stringify(response.content, null, 2)}</code>
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
