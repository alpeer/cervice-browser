'use client';

import clsx from 'clsx';
import Collapsible from '@/ui/Collapsible/Collapsible';
import styles from './ObjectDetail.module.scss';

export default function ObjectDetail({ object }) {
  const { label, schema } = object;

  return (
    <div className={styles.objectDetail}>
      <div className={styles.header}>
        <h2>{label}</h2>
        {schema.type && (
          <span className={styles.typeBadge}>{schema.type}</span>
        )}
      </div>

      {schema.description && (
        <p className={styles.description}>{schema.description}</p>
      )}

      {/* Properties */}
      {schema.properties && (
        <div className={styles.section}>
          <h3>Properties</h3>
          <table className={styles.propertiesTable}>
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
                      <span className={clsx(styles.badge, styles.badgeRequired)}>Yes</span>
                    ) : (
                      <span className={clsx(styles.badge, styles.badgeOptional)}>No</span>
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
        <div className={styles.section}>
          <h3>Enum Values</h3>
          <ul className={styles.enumList}>
            {schema.enum.map((value, idx) => (
              <li key={idx}><code>{JSON.stringify(value)}</code></li>
            ))}
          </ul>
        </div>
      )}

      {/* Full Schema */}
      <div className={styles.section}>
        <Collapsible title="Full Schema (JSON)">
          <pre className={styles.schemaCode}>
            <code>{JSON.stringify(schema, null, 2)}</code>
          </pre>
        </Collapsible>
      </div>
    </div>
  );
}
