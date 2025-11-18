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
 * @param {Array} existingColumns - Existing columns array to check for duplicates
 * @returns {Object} Object with parsedRelations array and generatedColumns array
 */
function parseTypeORMRelations(relations, entityName, existingColumns) {
  if (!relations || typeof relations !== 'object') {
    return { parsedRelations: [], generatedColumns: [] };
  }

  const parsedRelations = [];
  const generatedColumns = [];
  const existingColumnNames = new Set(existingColumns.map(c => c.name));

  Object.entries(relations).forEach(([relationName, relationDef]) => {
    // Skip one-to-many and inverse relations (we only track many-to-one and many-to-many)
    if (relationDef.type === 'one-to-many') {
      return; // Skip - this is the inverse side
    }

    // Extract join column information
    let fromColumn = null;
    let joinColumnDef = null;

    // Check for joinTable (many-to-many)
    if (relationDef.joinTable) {
      const joinTable = relationDef.joinTable;

      // For many-to-many, we create the join column from joinTable.joinColumn
      if (joinTable.joinColumn) {
        if (typeof joinTable.joinColumn === 'object' && joinTable.joinColumn.name) {
          fromColumn = joinTable.joinColumn.name;
          joinColumnDef = {
            name: fromColumn,
            referencedColumnName: joinTable.joinColumn.referencedColumnName || 'id',
          };
        }
      }
    }
    // Check for joinColumn (many-to-one, one-to-one)
    else if (relationDef.joinColumn) {
      if (typeof relationDef.joinColumn === 'object' && relationDef.joinColumn.name) {
        fromColumn = relationDef.joinColumn.name;
        joinColumnDef = {
          name: fromColumn,
          referencedColumnName: relationDef.joinColumn.referencedColumnName || 'id',
        };
      } else if (relationDef.joinColumn === true) {
        // Auto-generate join column name
        fromColumn = `${relationName}Id`;
        joinColumnDef = {
          name: fromColumn,
          referencedColumnName: 'id',
        };
      }
    }
    // No explicit joinColumn - infer from relation name
    else if (relationDef.type === 'many-to-one') {
      fromColumn = `${relationName}_id`;
      joinColumnDef = {
        name: fromColumn,
        referencedColumnName: 'id',
      };
    }

    // Generate column if it doesn't exist
    if (fromColumn && !existingColumnNames.has(fromColumn)) {
      generatedColumns.push({
        name: fromColumn,
        type: 'int', // Default to int for foreign keys
        nullable: relationDef.nullable !== false,
        unique: relationDef.type === 'one-to-one', // One-to-one should be unique
        primaryKey: false,
        autoIncrement: false,
        generated: true, // Mark as generated from relation
      });
      existingColumnNames.add(fromColumn);
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
        toColumn: joinColumnDef?.referencedColumnName || 'id',
        onDelete: relationDef.onDelete,
        onUpdate: relationDef.onUpdate,
        cascade: relationDef.cascade,
        relationName: relationName,
      });
    }
  });

  return { parsedRelations, generatedColumns };
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
      const { parsedRelations, generatedColumns } = parseTypeORMRelations(schema.relations, entityName, columns);
      relations = parsedRelations;
      // Add generated columns to columns array
      columns.push(...generatedColumns);
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
          cascade: rel.cascade,
          relationName: rel.name || rel.fromColumn,
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
 * @param {Array} relations - Array of relation objects
 * @returns {Array} React Flow nodes
 */
export function entitiesToNodes(entities, relations = []) {
  const nodes = [];

  Object.values(entities).forEach((entity, index) => {
    // Find all relations involving this entity (both as source and target)
    const entityRelations = relations.filter(
      rel => rel.fromEntity === entity.name || rel.toEntity === entity.name
    );

    nodes.push({
      id: entity.name,
      type: 'entityNode',
      position: { x: (index % 3) * 400, y: Math.floor(index / 3) * 350 },
      data: {
        name: entity.name,
        tableName: entity.tableName,
        columns: entity.columns,
        indexes: entity.indexes,
        relations: entityRelations,
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
    sourceHandle: `${rel.fromEntity}-${rel.fromColumn}-source`, // Specific column handle
    targetHandle: `${rel.toEntity}-${rel.toColumn}-target`,   // Specific column handle
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
