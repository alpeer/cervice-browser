'use client';

import { Handle, Position } from '@xyflow/react';
import './EntityNode.scss';

/**
 * Custom React Flow node for Entity display
 * Shows entity name (draggable), columns, and indexes
 */
export default function EntityNode({ data, selected }) {
  const { name, tableName, columns = [], indexes = [], description } = data;

  const renderColumnTag = (column) => {
    const tags = [];

    if (column.primaryKey) {
      tags.push(<span key="pk" className="column-tag column-tag--pk">PK</span>);
    }
    if (column.unique) {
      tags.push(<span key="unique" className="column-tag column-tag--unique">UNIQUE</span>);
    }
    if (column.nullable) {
      tags.push(<span key="null" className="column-tag column-tag--null">NULL</span>);
    }
    if (column.autoIncrement) {
      tags.push(<span key="auto" className="column-tag column-tag--auto">AUTO</span>);
    }

    return tags;
  };

  return (
    <div className={`entity-node ${selected ? 'entity-node--selected' : ''}`}>
      {/* Input/Output handles for connections */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {/* Header - Draggable */}
      <div className="entity-node__header drag-handle">
        <h4 className="entity-node__title">{name}</h4>
        {tableName !== name && (
          <span className="entity-node__table-name">({tableName})</span>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="entity-node__description">{description}</div>
      )}

      {/* Columns */}
      <div className="entity-node__content">
        {columns.length === 0 && (
          <div className="entity-node__empty">No columns defined</div>
        )}
        {columns.map((column) => (
          <div key={column.name} className="entity-node__column">
            <div className="entity-node__column-header">
              <span className="column-name">{column.name}</span>
              <span className="column-type">{column.type}</span>
            </div>
            {(column.primaryKey || column.unique || column.nullable || column.autoIncrement) && (
              <div className="entity-node__column-tags">
                {renderColumnTag(column)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Indexes Footer */}
      {indexes.length > 0 && (
        <div className="entity-node__footer">
          <div className="entity-node__footer-title">Indexes</div>
          {indexes.map((index, idx) => (
            <div key={idx} className="entity-node__index">
              <span className="index-name">{index.name || `idx_${idx}`}</span>
              <span className="index-columns">
                ({Array.isArray(index.columns) ? index.columns.join(', ') : index.columns})
              </span>
              {index.unique && (
                <span className="index-badge index-badge--unique">UNIQUE</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
