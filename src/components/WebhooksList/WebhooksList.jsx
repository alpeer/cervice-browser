'use client';

import clsx from 'clsx';
import Collapsible from '@/ui/Collapsible/Collapsible';
import { getMethodColor } from '@/components/EndpointsList/helpers/groupByTags';
import styles from './WebhooksList.module.scss';

export default function WebhooksList({ spec }) {
  const webhooks = spec?.webhooks || {};
  const webhookNames = Object.keys(webhooks).sort();

  if (webhookNames.length === 0) {
    return (
      <div className={styles.webhooksList}>
        <div className={styles.empty}>
          <p>No webhooks defined</p>
          <p className={styles.note}>
            Webhooks are supported in OpenAPI 3.1.0 and later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.webhooksList}>
      <h2>Webhooks</h2>
      <p className={styles.info}>Total: {webhookNames.length} webhooks</p>

      {webhookNames.map((name) => {
        const webhook = webhooks[name];
        const methods = Object.keys(webhook).filter(key =>
          ['get', 'post', 'put', 'delete', 'patch'].includes(key.toLowerCase())
        );

        return (
          <Collapsible key={name} title={name}>
            <div className={styles.webhookDetails}>
              {methods.map((method) => {
                const details = webhook[method];
                return (
                  <div key={method} className={styles.webhookMethod}>
                    <div className={styles.webhookMethodHeader}>
                      <span className={clsx(styles.method, styles[`method${getMethodColor(method.toUpperCase()).charAt(0).toUpperCase() + getMethodColor(method.toUpperCase()).slice(1)}`])}>
                        {method.toUpperCase()}
                      </span>
                      {details.summary && (
                        <span className={styles.webhookMethodSummary}>{details.summary}</span>
                      )}
                    </div>

                    {details.description && (
                      <p className={styles.webhookMethodDescription}>
                        {details.description}
                      </p>
                    )}

                    {details.requestBody && (
                      <div className={styles.webhookMethodRequest}>
                        <h4>Request Body</h4>
                        <p>{details.requestBody.description || 'No description'}</p>
                      </div>
                    )}

                    {details.responses && (
                      <div className={styles.webhookMethodResponses}>
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
