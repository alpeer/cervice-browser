'use client';

import Collapsible from '@/ui/Collapsible/Collapsible';
import './ObjectDetail.scss';

export default function ObjectDetail({ object }) {
  const { label, schema } = object;

  return (
    <div className="object-detail">
      <div className="object-detail__header">
        <h2>{label}</h2>
        {schema.type && (
          <span className="type-badge">{schema.type}</span>
        )}
      </div>

      {schema.description && (
        <p className="object-detail__description">{schema.description}</p>
      )}

      {/* Properties */}
      {schema.properties && (
        <div className="object-detail__section">
          <h3>Properties</h3>
          <table className="properties-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Format</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(schema.properties).map(([propName, propDetails]) => (
                <tr key={propName}>
                  <td><code>{propName}</code></td>
                  <td>{propDetails.type || 'N/A'}</td>
                  <td>{propDetails.format || '-'}</td>
                  <td>
                    {schema.required?.includes(propName) ? (
                      <span className="badge badge--required">Yes</span>
                    ) : (
                      <span className="badge badge--optional">No</span>
                    )}
                  </td>
                  <td>{propDetails.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enum values */}
      {schema.enum && (
        <div className="object-detail__section">
          <h3>Enum Values</h3>
          <ul className="enum-list">
            {schema.enum.map((value, idx) => (
              <li key={idx}><code>{JSON.stringify(value)}</code></li>
            ))}
          </ul>
        </div>
      )}

      {/* Full Schema */}
      <div className="object-detail__section">
        <Collapsible title="Full Schema (JSON)">
          <pre className="schema-code">
            <code>{JSON.stringify(schema, null, 2)}</code>
          </pre>
        </Collapsible>
      </div>
    </div>
  );
}
