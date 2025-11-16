'use client';

import Collapsible from '@/ui/Collapsible/Collapsible';
import './ObjectsList.scss';

export default function ObjectsList({ spec }) {
  const schemas = spec?.components?.schemas || {};
  const schemaNames = Object.keys(schemas).sort();

  if (schemaNames.length === 0) {
    return (
      <div className="objects-list">
        <p className="objects-list__empty">No schemas found</p>
      </div>
    );
  }

  return (
    <div className="objects-list">
      <h2>Schemas</h2>
      <p className="objects-list__info">Total: {schemaNames.length} schemas</p>

      {schemaNames.map((name) => {
        const schema = schemas[name];
        return (
          <Collapsible key={name} title={name}>
            <div className="schema-details">
              {schema.type && (
                <p className="schema-details__type">
                  <strong>Type:</strong> {schema.type}
                </p>
              )}

              {schema.description && (
                <p className="schema-details__description">
                  {schema.description}
                </p>
              )}

              {schema.properties && (
                <div className="schema-details__properties">
                  <h4>Properties:</h4>
                  <table className="properties-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(schema.properties).map(([propName, propDetails]) => (
                        <tr key={propName}>
                          <td>
                            <code>{propName}</code>
                          </td>
                          <td>{propDetails.type || 'N/A'}</td>
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

              {schema.enum && (
                <div className="schema-details__enum">
                  <h4>Enum values:</h4>
                  <ul>
                    {schema.enum.map((value, idx) => (
                      <li key={idx}><code>{JSON.stringify(value)}</code></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
