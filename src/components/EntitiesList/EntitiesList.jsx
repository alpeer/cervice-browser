'use client';

import './EntitiesList.scss';

export default function EntitiesList() {
  return (
    <div className="entities-list">
      <h2>Database Entities</h2>
      <p className="entities-list__info">
        Define custom database entities for your application
      </p>

      <div className="entities-list__empty">
        <div className="entities-list__empty-content">
          <svg
            className="entities-list__empty-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
          <h3>No entities defined yet</h3>
          <p>
            Entity management functionality will be implemented in a future update.
            Users will be able to define custom database entities and generate ORM code.
          </p>
        </div>
      </div>
    </div>
  );
}
