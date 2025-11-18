'use client';

import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Tooltip, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import './EntityNode.scss';

/**
 * Custom React Flow node for Entity display
 * Shows entity name (draggable), columns, relations, and indexes
 */
export default function EntityNode({ data, selected }) {
  const { name, tableName, columns = [], indexes = [], relations = [], description } = data;
  const [relationsExpanded, setRelationsExpanded] = useState(false);

  // Map column names to check if they have relations
  const columnRelationsMap = {};
  relations.forEach(rel => {
    if (!columnRelationsMap[rel.fromColumn]) {
      columnRelationsMap[rel.fromColumn] = [];
    }
    columnRelationsMap[rel.fromColumn].push(rel);
  });

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
    if (column.generated) {
      tags.push(<span key="fk" className="column-tag column-tag--fk">FK</span>);
    }

    return tags;
  };

  return (
    <div className={`entity-node ${selected ? 'entity-node--selected' : ''}`}>
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
      <div className="entity-node__columns">
        {columns.length === 0 && (
          <div className="entity-node__empty">No columns defined</div>
        )}
        {columns.map((column) => {
          const hasRelation = !!columnRelationsMap[column.name];
          const handleId = `${name}-${column.name}`;

          return (
            <div key={column.name} className="entity-node__column">
              {/* Connection handles for columns with relations */}
              {hasRelation && (
                <>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`${handleId}-source`}
                    className="column-handle column-handle--source"
                  />
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={`${handleId}-target`}
                    className="column-handle column-handle--target"
                  />
                </>
              )}

              <div className="entity-node__column-header">
                <span className="column-name">{column.name}</span>
                <span className="column-type">{column.type}</span>
              </div>
              {(column.primaryKey || column.unique || column.nullable || column.autoIncrement || column.generated) && (
                <div className="entity-node__column-tags">
                  {renderColumnTag(column)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Relations */}
      {relations.length > 0 && (
        <div className="entity-node__relations">
          <div
            className="entity-node__relations-header"
            onClick={() => setRelationsExpanded(!relationsExpanded)}
          >
            <span className="entity-node__relations-title">
              Relations ({relations.length})
            </span>
            {relationsExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </div>
          {relationsExpanded && (
            <div className="entity-node__relations-content">
              {relations.map((rel, idx) => (
                <div key={idx} className="entity-node__relation">
                  <div className="relation-name">{rel.relationName}</div>
                  <div className="relation-details">
                    <span className="relation-target">{rel.toEntity}</span>
                    <span className="relation-type">{rel.cardinality}</span>
                  </div>
                  {(rel.onDelete || rel.onUpdate || rel.cascade) && (
                    <div className="relation-actions">
                      {rel.onDelete && (
                        <span className="relation-action">onDelete: {rel.onDelete}</span>
                      )}
                      {rel.onUpdate && (
                        <span className="relation-action">onUpdate: {rel.onUpdate}</span>
                      )}
                      {rel.cascade && (
                        <span className="relation-action">cascade: true</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Indexes Footer */}
      {indexes.length > 0 && (
        <div className="entity-node__footer">
          <div className="entity-node__footer-title">Indexes</div>
          <div className="entity-node__indexes">
            {indexes.map((index, idx) => {
              const columnsStr = Array.isArray(index.columns)
                ? index.columns.join(', ')
                : index.columns;

              return (
                <Tooltip
                  key={idx}
                  title={`Columns: ${columnsStr}`}
                  placement="top"
                  arrow
                >
                  <div className="entity-node__index">
                    <span className="index-name">{index.name || `idx_${idx}`}</span>
                    {index.unique && (
                      <span className="index-badge index-badge--unique">UNIQUE</span>
                    )}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
