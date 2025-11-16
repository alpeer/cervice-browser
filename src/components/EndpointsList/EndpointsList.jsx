'use client';

import Collapsible from '@/ui/Collapsible/Collapsible';
import { groupByTags, getMethodColor } from './helpers/groupByTags';
import './EndpointsList.scss';

export default function EndpointsList({ spec }) {
  if (!spec?.paths) {
    return (
      <div className="endpoints-list">
        <p className="endpoints-list__empty">No endpoints found</p>
      </div>
    );
  }

  const grouped = groupByTags(spec.paths);
  const tags = Object.keys(grouped).sort();

  return (
    <div className="endpoints-list">
      <h2>API Endpoints</h2>
      <p className="endpoints-list__info">
        Total: {tags.length} tags, {
          Object.values(grouped).reduce((sum, endpoints) => sum + endpoints.length, 0)
        } endpoints
      </p>

      {tags.map((tag) => (
        <Collapsible key={tag} title={`${tag} (${grouped[tag].length})`}>
          <ul className="endpoints-list__items">
            {grouped[tag].map((endpoint, idx) => (
              <li
                key={idx}
                className={`endpoint-item ${endpoint.deprecated ? 'endpoint-item--deprecated' : ''}`}
              >
                <div className="endpoint-item__main">
                  <span className={`method method--${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  <span className="path">{endpoint.path}</span>
                </div>
                {endpoint.summary && (
                  <p className="summary">{endpoint.summary}</p>
                )}
                {endpoint.deprecated && (
                  <span className="deprecated-badge">DEPRECATED</span>
                )}
              </li>
            ))}
          </ul>
        </Collapsible>
      ))}
    </div>
  );
}
