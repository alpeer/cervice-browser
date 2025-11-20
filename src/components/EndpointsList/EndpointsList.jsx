'use client';

import clsx from 'clsx';
import Collapsible from '@/ui/Collapsible/Collapsible';
import { groupByTags, getMethodColor } from './helpers/groupByTags';
import styles from './EndpointsList.module.scss';

export default function EndpointsList({ spec }) {
  if (!spec?.paths) {
    return (
      <div className={styles.endpointsList}>
        <p className={styles.empty}>No endpoints found</p>
      </div>
    );
  }

  const grouped = groupByTags(spec.paths);
  const tags = Object.keys(grouped).sort();

  return (
    <div className={styles.endpointsList}>
      <h2>API Endpoints</h2>
      <p className={styles.info}>
        Total: {tags.length} tags, {
          Object.values(grouped).reduce((sum, endpoints) => sum + endpoints.length, 0)
        } endpoints
      </p>

      {tags.map((tag) => (
        <Collapsible key={tag} title={`${tag} (${grouped[tag].length})`}>
          <ul className={styles.items}>
            {grouped[tag].map((endpoint, idx) => (
              <li
                key={idx}
                className={clsx(styles.endpointItem, endpoint.deprecated && styles.endpointItemDeprecated)}
              >
                <div className={styles.endpointItemMain}>
                  <span className={clsx(styles.method, styles[`method${getMethodColor(endpoint.method).charAt(0).toUpperCase() + getMethodColor(endpoint.method).slice(1)}`])}>
                    {endpoint.method}
                  </span>
                  <span className={styles.path}>{endpoint.path}</span>
                </div>
                {endpoint.summary && (
                  <p className={styles.summary}>{endpoint.summary}</p>
                )}
                {endpoint.deprecated && (
                  <span className={styles.deprecatedBadge}>DEPRECATED</span>
                )}
              </li>
            ))}
          </ul>
        </Collapsible>
      ))}
    </div>
  );
}
