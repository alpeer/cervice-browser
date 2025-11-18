/**
 * Parse entity schema files and analyze relationships
 */

/**
 * Detect relation type from column definition
 * @param {Object} column - Column definition
 * @returns {string|null} Relation type or null
 */
function detectRelationType(column) {
  const type = column.type?.toLowerCase() || '';
  const name = column.name?.toLowerCase() || '';

  // Check for foreign key indicators
  if (name.endsWith('_id') || name.endsWith('id') || column.foreignKey) {
    return 'many-to-one'; // Default for FK
  }

  return null;
}

/**
 * Extract referenced entity and column from foreign key definition
 * @param {Object} column - Column definition
 * @param {string} columnName - Name of the column
 * @returns {Object|null} Reference info or null
 */
function extractReference(column, columnName) {
  // Check explicit foreignKey definition
  if (column.foreignKey) {
    return {
      entity: column.foreignKey.entity || column.foreignKey.table,
      column: column.foreignKey.column || 'id',
      onDelete: column.foreignKey.onDelete,
      onUpdate: column.foreignKey.onUpdate,
    };
  }

  // Try to infer from column name (e.g., user_id -> User.id)
  if (columnName.endsWith('_id')) {
    const entityName = columnName.slice(0, -3);
    const capitalizedEntity = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    return {
      entity: capitalizedEntity,
      column: 'id',
      onDelete: null,
      onUpdate: null,
    };
  }

  if (columnName.endsWith('Id') && columnName.length > 2) {
    const entityName = columnName.slice(0, -2);
    const capitalizedEntity = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    return {
      entity: capitalizedEntity,
      column: 'id',
      onDelete: null,
      onUpdate: null,
    };
  }

  return null;
}

/**
 * Parse a single entity schema
 * @param {Object} schema - Entity schema object
 * @param {string} fileName - Original file name
 * @returns {Object} Parsed entity
 */
export function parseEntitySchema(schema, fileName) {
  const entityName = schema.name || schema.tableName || fileName.replace(/\.(js|json)$/, '');

  const columns = [];
  const indexes = [];
  const relations = [];

  // Parse columns
  if (schema.columns && Array.isArray(schema.columns)) {
    schema.columns.forEach((col) => {
      const columnDef = {
        name: col.name,
        type: col.type,
        nullable: col.nullable !== false, // Default to true
        unique: col.unique || false,
        primaryKey: col.primaryKey || col.primary || false,
        autoIncrement: col.autoIncrement || col.auto || false,
        default: col.default,
      };

      columns.push(columnDef);

      // Check for relations
      const reference = extractReference(col, col.name);
      if (reference) {
        relations.push({
          type: 'many-to-one',
          fromEntity: entityName,
          fromColumn: col.name,
          toEntity: reference.entity,
          toColumn: reference.column,
          onDelete: reference.onDelete,
          onUpdate: reference.onUpdate,
        });
      }
    });
  } else if (schema.columns && typeof schema.columns === 'object') {
    // Handle object-style column definitions
    Object.entries(schema.columns).forEach(([colName, colDef]) => {
      const columnDef = {
        name: colName,
        type: typeof colDef === 'string' ? colDef : colDef.type,
        nullable: colDef.nullable !== false,
        unique: colDef.unique || false,
        primaryKey: colDef.primaryKey || colDef.primary || false,
        autoIncrement: colDef.autoIncrement || colDef.auto || false,
        default: colDef.default,
      };

      columns.push(columnDef);

      // Check for relations
      if (typeof colDef === 'object') {
        const reference = extractReference(colDef, colName);
        if (reference) {
          relations.push({
            type: 'many-to-one',
            fromEntity: entityName,
            fromColumn: colName,
            toEntity: reference.entity,
            toColumn: reference.column,
            onDelete: reference.onDelete,
            onUpdate: reference.onUpdate,
          });
        }
      }
    });
  }

  // Parse indexes
  if (schema.indexes && Array.isArray(schema.indexes)) {
    schema.indexes.forEach((idx) => {
      indexes.push({
        name: idx.name,
        columns: Array.isArray(idx.columns) ? idx.columns : [idx.column],
        unique: idx.unique || false,
        type: idx.type || 'BTREE',
      });
    });
  }

  // Parse explicit relations (many-to-many, one-to-one)
  if (schema.relations && Array.isArray(schema.relations)) {
    schema.relations.forEach((rel) => {
      relations.push({
        type: rel.type || 'many-to-one',
        fromEntity: entityName,
        fromColumn: rel.fromColumn || rel.column,
        toEntity: rel.toEntity || rel.entity,
        toColumn: rel.toColumn || 'id',
        onDelete: rel.onDelete,
        onUpdate: rel.onUpdate,
      });
    });
  }

  return {
    name: entityName,
    tableName: schema.tableName || entityName,
    columns,
    indexes,
    relations,
    description: schema.description,
  };
}

/**
 * Parse multiple entity schemas
 * @param {Array} files - Array of {name, content} objects
 * @returns {Object} Parsed entities and relationships
 */
export function parseEntities(files) {
  const entities = {};
  const allRelations = [];

  files.forEach(({ name, content }) => {
    try {
      let schema;

      // Parse JSON or JS module
      if (typeof content === 'string') {
        schema = JSON.parse(content);
      } else {
        schema = content;
      }

      const entity = parseEntitySchema(schema, name);
      entities[entity.name] = entity;
      allRelations.push(...entity.relations);
    } catch (error) {
      console.error(`Failed to parse entity ${name}:`, error);
    }
  });

  // Analyze and enhance relations
  const enhancedRelations = analyzeRelations(allRelations, entities);

  return {
    entities,
    relations: enhancedRelations,
  };
}

/**
 * Analyze relations and determine cardinality
 * @param {Array} relations - Array of relation objects
 * @param {Object} entities - Map of entity name to entity object
 * @returns {Array} Enhanced relations with cardinality
 */
function analyzeRelations(relations, entities) {
  const enhanced = [];

  relations.forEach((rel) => {
    const fromEntity = entities[rel.fromEntity];
    const toEntity = entities[rel.toEntity];

    if (!fromEntity || !toEntity) {
      return; // Skip if entity doesn't exist
    }

    // Determine cardinality
    let cardinality = '1:n'; // Default many-to-one

    if (rel.type === 'one-to-one') {
      cardinality = '1:1';
    } else if (rel.type === 'many-to-many') {
      cardinality = 'n:n';
    } else {
      // Check if fromColumn is unique (indicates one-to-one)
      const fromColumn = fromEntity.columns.find(c => c.name === rel.fromColumn);
      if (fromColumn?.unique || fromColumn?.primaryKey) {
        cardinality = '1:1';
      }
    }

    enhanced.push({
      ...rel,
      cardinality,
      id: `${rel.fromEntity}.${rel.fromColumn}-${rel.toEntity}.${rel.toColumn}`,
    });
  });

  return enhanced;
}

/**
 * Convert entities to React Flow nodes
 * @param {Object} entities - Map of entity name to entity object
 * @returns {Array} React Flow nodes
 */
export function entitiesToNodes(entities) {
  const nodes = [];

  Object.values(entities).forEach((entity, index) => {
    nodes.push({
      id: entity.name,
      type: 'entityNode',
      position: { x: (index % 3) * 400, y: Math.floor(index / 3) * 350 },
      data: {
        name: entity.name,
        tableName: entity.tableName,
        columns: entity.columns,
        indexes: entity.indexes,
        description: entity.description,
      },
    });
  });

  return nodes;
}

/**
 * Convert relations to React Flow edges
 * @param {Array} relations - Array of relation objects
 * @returns {Array} React Flow edges
 */
export function relationsToEdges(relations) {
  return relations.map((rel) => ({
    id: rel.id,
    source: rel.fromEntity,
    target: rel.toEntity,
    type: 'smoothstep',
    animated: false,
    label: rel.cardinality,
    data: {
      fromColumn: rel.fromColumn,
      toColumn: rel.toColumn,
      onDelete: rel.onDelete,
      onUpdate: rel.onUpdate,
      cardinality: rel.cardinality,
    },
    markerEnd: {
      type: 'arrowclosed',
    },
  }));
}
