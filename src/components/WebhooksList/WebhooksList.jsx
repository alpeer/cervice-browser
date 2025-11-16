'use client';

import Collapsible from '@/ui/Collapsible/Collapsible';
import { getMethodColor } from '@/components/EndpointsList/helpers/groupByTags';
import './WebhooksList.scss';

export default function WebhooksList({ spec }) {
  const webhooks = spec?.webhooks || {};
  const webhookNames = Object.keys(webhooks).sort();

  if (webhookNames.length === 0) {
    return (
      <div className="webhooks-list">
        <div className="webhooks-list__empty">
          <p>No webhooks defined</p>
          <p className="webhooks-list__note">
            Webhooks are supported in OpenAPI 3.1.0 and later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="webhooks-list">
      <h2>Webhooks</h2>
      <p className="webhooks-list__info">Total: {webhookNames.length} webhooks</p>

      {webhookNames.map((name) => {
        const webhook = webhooks[name];
        const methods = Object.keys(webhook).filter(key =>
          ['get', 'post', 'put', 'delete', 'patch'].includes(key.toLowerCase())
        );

        return (
          <Collapsible key={name} title={name}>
            <div className="webhook-details">
              {methods.map((method) => {
                const details = webhook[method];
                return (
                  <div key={method} className="webhook-method">
                    <div className="webhook-method__header">
                      <span className={`method method--${getMethodColor(method.toUpperCase())}`}>
                        {method.toUpperCase()}
                      </span>
                      {details.summary && (
                        <span className="webhook-method__summary">{details.summary}</span>
                      )}
                    </div>

                    {details.description && (
                      <p className="webhook-method__description">
                        {details.description}
                      </p>
                    )}

                    {details.requestBody && (
                      <div className="webhook-method__request">
                        <h4>Request Body</h4>
                        <p>{details.requestBody.description || 'No description'}</p>
                      </div>
                    )}

                    {details.responses && (
                      <div className="webhook-method__responses">
                        <h4>Responses</h4>
                        <ul>
                          {Object.entries(details.responses).map(([code, response]) => (
                            <li key={code}>
                              <strong>{code}:</strong> {response.description || 'No description'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
