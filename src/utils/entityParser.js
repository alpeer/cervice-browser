/**
 * Parse entity schema files and analyze relationships
 * Supports both JSON and JS module exports (TypeORM EntitySchema format)
 */

/**
 * Extract EntitySchema from JS module content
 * @param {string} jsContent - JS file content
 * @returns {Object|null} Extracted schema object or null
 */
function extractEntitySchemaFromJS(jsContent) {
  try {
    // Remove import statements and extract the EntitySchema argument
    const entitySchemaMatch = jsContent.match(/new\s+EntitySchema\s*\(\s*(\{[\s\S]*?\})\s*\)/);

    if (!entitySchemaMatch) {
      return null;
    }

    // Extract the schema object
    let schemaStr = entitySchemaMatch[1];

    // Convert JS object notation to JSON
    // Handle unquoted keys
    schemaStr = schemaStr.replace(/(\w+):/g, '"$1":');
    // Handle single quotes to double quotes
    schemaStr = schemaStr.replace(/'/g, '"');
    // Handle trailing commas
    schemaStr = schemaStr.replace(/,(\s*[}\]])/g, '$1');

    return JSON.parse(schemaStr);
  } catch (error) {
    console.error('Failed to extract EntitySchema from JS:', error);
    return null;
  }
}

/**
 * Normalize column definition to internal format
 * @param {string} colName - Column name
 * @param {Object} colDef - Column definition
 * @returns {Object} Normalized column definition
 */
function normalizeColumn(colName, colDef) {
  // Handle TypeORM 'generated' property
  let autoIncrement = false;
  if (colDef.generated === true || colDef.generated === 'increment') {
    autoIncrement = true;
  }

  // Build type string with length/precision if available
  let typeStr = colDef.type;
  if (colDef.length) {
    typeStr += `(${colDef.length})`;
  } else if (colDef.precision && colDef.scale) {
    typeStr += `(${colDef.precision},${colDef.scale})`;
  }

  // Handle enum type
  if (colDef.enum && Array.isArray(colDef.enum)) {
    typeStr = `enum(${colDef.enum.join(',')})`;
  }

  return {
    name: colName,
    type: typeStr,
    nullable: colDef.nullable !== false, // Default to true
    unique: colDef.unique || false,
    primaryKey: colDef.primaryKey || colDef.primary || false,
    autoIncrement: autoIncrement || colDef.autoIncrement || colDef.auto || false,
    default: colDef.default,
  };
}

/**
 * Parse TypeORM relations object
 * @param {Object} relations - Relations object from EntitySchema
 * @param {string} entityName - Name of the entity
 * @returns {Array} Array of relation objects
 */
function parseTypeORMRelations(relations, entityName) {
  if (!relations || typeof relations !== 'object') {
    return [];
  }

  const parsedRelations = [];

  Object.entries(relations).forEach(([relationName, relationDef]) => {
    // Skip one-to-many and inverse relations (we only track many-to-one and many-to-many)
    if (relationDef.type === 'one-to-many') {
      return; // Skip - this is the inverse side
    }

    // Extract join column name
    let fromColumn = null;
    if (relationDef.joinColumn && relationDef.joinColumn.name) {
      fromColumn = relationDef.joinColumn.name;
    } else if (relationDef.type === 'many-to-one') {
      // Infer from relation name (e.g., 'user' -> 'user_id')
      fromColumn = `${relationName}_id`;
    }

    // Determine relation type for our system
    let relationType = 'many-to-one';
    if (relationDef.type === 'many-to-many') {
      relationType = 'many-to-many';
    } else if (relationDef.type === 'one-to-one') {
      relationType = 'one-to-one';
    }

    if (fromColumn) {
      parsedRelations.push({
        type: relationType,
        fromEntity: entityName,
        fromColumn: fromColumn,
        toEntity: relationDef.target,
        toColumn: 'id', // Default to id
        onDelete: relationDef.onDelete,
        onUpdate: relationDef.onUpdate,
      });
    }
  });

  return parsedRelations;
}

/**
 * Parse a single entity schema
 * @param {Object} schema - Entity schema object
 * @param {string} fileName - Original file name
 * @returns {Object} Parsed entity
 */
export function parseEntitySchema(schema, fileName) {
  const entityName = schema.name || schema.tableName || fileName.replace(/\.(entity\.)?(js|json)$/, '');

  const columns = [];
  const indexes = [];
  let relations = [];

  // Parse columns (TypeORM uses object-style columns)
  if (schema.columns && typeof schema.columns === 'object') {
    Object.entries(schema.columns).forEach(([colName, colDef]) => {
      const columnDef = normalizeColumn(colName, typeof colDef === 'string' ? { type: colDef } : colDef);
      columns.push(columnDef);
    });
  }

  // Parse indices (TypeORM uses 'indices' not 'indexes')
  const indexSource = schema.indices || schema.indexes;
  if (indexSource && Array.isArray(indexSource)) {
    indexSource.forEach((idx) => {
      indexes.push({
        name: idx.name,
        columns: Array.isArray(idx.columns) ? idx.columns : [idx.column],
        unique: idx.unique || false,
        type: idx.type || 'BTREE',
      });
    });
  }

  // Parse relations
  if (schema.relations) {
    if (typeof schema.relations === 'object' && !Array.isArray(schema.relations)) {
      // TypeORM format (object with relation definitions)
      relations = parseTypeORMRelations(schema.relations, entityName);
    } else if (Array.isArray(schema.relations)) {
      // Legacy array format
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

      // Determine if this is a JS or JSON file
      if (name.endsWith('.js')) {
        // Try to extract EntitySchema from JS module
        schema = extractEntitySchemaFromJS(content);
        if (!schema) {
          console.warn(`Could not extract EntitySchema from ${name}`);
          return;
        }
      } else {
        // Parse as JSON
        schema = typeof content === 'string' ? JSON.parse(content) : content;
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
  const seen = new Set(); // Prevent duplicate relations

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

    const relationId = `${rel.fromEntity}.${rel.fromColumn}-${rel.toEntity}.${rel.toColumn}`;

    // Skip duplicate relations
    if (seen.has(relationId)) {
      return;
    }
    seen.add(relationId);

    enhanced.push({
      ...rel,
      cardinality,
      id: relationId,
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
