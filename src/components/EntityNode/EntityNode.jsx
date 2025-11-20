'use client';

import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import clsx from 'clsx';
import styles from './EntityNode.module.scss';

/**
 * Custom React Flow node for Entity display
 * Shows entity name (draggable), columns, relations, and indexes
 */
export default function EntityNode({ data, selected }) {
  const { name, tableName, columns = [], indexes = [], relations = [], description } = data;
  const [relationsExpanded, setRelationsExpanded] = useState(false);

  // Map column names to check if they have relations
  // Need to check both fromColumn (for outgoing) and toColumn (for incoming)
  const columnRelationsMap = {};
  relations.forEach(rel => {
    // Add to fromColumn map if this entity is the source
    if (rel.fromEntity === name) {
      if (!columnRelationsMap[rel.fromColumn]) {
        columnRelationsMap[rel.fromColumn] = [];
      }
      columnRelationsMap[rel.fromColumn].push(rel);
    }
    // Add to toColumn map if this entity is the target
    if (rel.toEntity === name) {
      if (!columnRelationsMap[rel.toColumn]) {
        columnRelationsMap[rel.toColumn] = [];
      }
      columnRelationsMap[rel.toColumn].push(rel);
    }
  });

  const renderColumnTag = (column) => {
    const tags = [];

    if (column.primaryKey) {
      tags.push(<span key="pk" className={clsx(styles.columnTag, styles.columnTagPk)}>PK</span>);
    }
    if (column.unique) {
      tags.push(<span key="unique" className={clsx(styles.columnTag, styles.columnTagUnique)}>UNIQUE</span>);
    }
    if (column.nullable) {
      tags.push(<span key="null" className={clsx(styles.columnTag, styles.columnTagNull)}>NULL</span>);
    }
    if (column.autoIncrement) {
      tags.push(<span key="auto" className={clsx(styles.columnTag, styles.columnTagAuto)}>AUTO</span>);
    }
    if (column.generated) {
      tags.push(<span key="fk" className={clsx(styles.columnTag, styles.columnTagFk)}>FK</span>);
    }

    return tags;
  };

  return (
    <div className={clsx(styles.entityNode, { [styles.entityNodeSelected]: selected })}>
      {/* Header - Draggable */}
      <div className={clsx(styles.header, 'drag-handle')}>
        <h4 className={styles.title}>{name}</h4>
        {tableName !== name && (
          <span className={styles.tableName}>({tableName})</span>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className={styles.description}>{description}</div>
      )}

      {/* Columns */}
      <div className={styles.columns}>
        {columns.length === 0 && (
          <div className={styles.empty}>No columns defined</div>
        )}
        {columns.map((column) => {
          const hasRelation = !!columnRelationsMap[column.name];
          const handleId = `${name}-${column.name}`;

          return (
            <div key={column.name} className={styles.column}>
              {/* Connection handles for columns with relations */}
              {hasRelation && (
                <>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`${handleId}-source`}
                    className={clsx(styles.columnHandle, styles.columnHandleSource)}
                  />
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={`${handleId}-target`}
                    className={clsx(styles.columnHandle, styles.columnHandleTarget)}
                  />
                </>
              )}

              <div className={styles.columnHeader}>
                <span className={styles.columnName}>{column.name}</span>
                <span className={styles.columnType}>{column.type}</span>
              </div>
              {(column.primaryKey || column.unique || column.nullable || column.autoIncrement || column.generated) && (
                <div className={styles.columnTags}>
                  {renderColumnTag(column)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Relations */}
      {relations.filter(rel => rel.fromEntity === name).length > 0 && (
        <div className={styles.relations}>
          <div
            className={styles.relationsHeader}
            onClick={() => setRelationsExpanded(!relationsExpanded)}
          >
            <span className={styles.relationsTitle}>
              Relations ({relations.filter(rel => rel.fromEntity === name).length})
            </span>
            {relationsExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </div>
          {relationsExpanded && (
            <div className={styles.relationsContent}>
              {relations.filter(rel => rel.fromEntity === name).map((rel, idx) => (
                <div key={idx} className={styles.relation}>
                  <div className={styles.relationName}>{rel.relationName}</div>
                  <div className={styles.relationDetails}>
                    <span className={styles.relationTarget}>{rel.toEntity}</span>
                    <span className={styles.relationType}>{rel.cardinality}</span>
                  </div>
                  {(rel.onDelete || rel.onUpdate || rel.cascade) && (
                    <div className={styles.relationActions}>
                      {rel.onDelete && (
                        <span className={styles.relationAction}>onDelete: {rel.onDelete}</span>
                      )}
                      {rel.onUpdate && (
                        <span className={styles.relationAction}>onUpdate: {rel.onUpdate}</span>
                      )}
                      {rel.cascade && (
                        <span className={styles.relationAction}>cascade: true</span>
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
        <div className={styles.footer}>
          <div className={styles.footerTitle}>Indexes</div>
          <div className={styles.indexes}>
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
                  <div className={styles.index}>
                    <span className={styles.indexName}>{index.name || `idx_${idx}`}</span>
                    {index.unique && (
                      <span className={clsx(styles.indexBadge, styles.indexBadgeUnique)}>UNIQUE</span>
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
