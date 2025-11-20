/**
 * Utility functions for resolving OpenAPI/Swagger schema references
 */

/**
 * Get the definitions/schemas object from spec
 * @param {Object} spec - The OpenAPI/Swagger spec
 * @param {boolean} isSwagger - Whether this is Swagger 2.0
 * @returns {Object} The schemas object
 */
function getSchemas(spec, isSwagger) {
  if (isSwagger) {
    return spec.definitions || {};
  }
  return spec.components?.schemas || {};
}

/**
 * Resolve a $ref reference to its actual schema
 * @param {string} ref - The reference string (e.g., "#/definitions/Pet" or "#/components/schemas/Pet")
 * @param {Object} spec - The full spec
 * @param {boolean} isSwagger - Whether this is Swagger 2.0
 * @returns {Object|null} The resolved schema or null if not found
 */
function resolveRef(ref, spec, isSwagger) {
  if (!ref || typeof ref !== 'string') return null;

  // Extract the schema name from the reference
  const parts = ref.split('/');
  const schemaName = parts[parts.length - 1];

  const schemas = getSchemas(spec, isSwagger);
  return schemas[schemaName] || null;
}

/**
 * Recursively resolve a schema, handling $ref, allOf, anyOf, oneOf
 * @param {Object} schema - The schema to resolve
 * @param {Object} spec - The full spec
 * @param {boolean} isSwagger - Whether this is Swagger 2.0
 * @param {Set} visited - Set of visited refs to prevent circular references
 * @returns {Object} The fully resolved schema
 */
export function resolveSchema(schema, spec, isSwagger, visited = new Set()) {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  // Handle $ref
  if (schema.$ref) {
    // Prevent circular references
    if (visited.has(schema.$ref)) {
      return { type: 'object', description: `Circular reference to ${schema.$ref}` };
    }

    visited.add(schema.$ref);
    const resolved = resolveRef(schema.$ref, spec, isSwagger);

    if (resolved) {
      // Recursively resolve the referenced schema
      return resolveSchema(resolved, spec, isSwagger, visited);
    }

    return { type: 'object', description: `Unresolved reference: ${schema.$ref}` };
  }

  // Create a copy to avoid mutating the original
  const result = { ...schema };

  // Handle allOf - merge all schemas
  if (schema.allOf && Array.isArray(schema.allOf)) {
    const merged = { type: 'object', properties: {}, required: [] };

    schema.allOf.forEach(subSchema => {
      const resolved = resolveSchema(subSchema, spec, isSwagger, visited);

      if (resolved.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties };
      }

      if (resolved.required) {
        merged.required = [...(merged.required || []), ...resolved.required];
      }

      // Merge other properties
      Object.keys(resolved).forEach(key => {
        if (key !== 'properties' && key !== 'required' && key !== 'allOf') {
          merged[key] = resolved[key];
        }
      });
    });

    // Remove duplicate required fields
    if (merged.required) {
      merged.required = [...new Set(merged.required)];
    }

    return merged;
  }

  // Handle anyOf / oneOf - for now, just resolve each option
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    result.anyOf = schema.anyOf.map(s => resolveSchema(s, spec, isSwagger, visited));
  }

  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    result.oneOf = schema.oneOf.map(s => resolveSchema(s, spec, isSwagger, visited));
  }

  // Handle properties
  if (schema.properties) {
    result.properties = {};
    Object.entries(schema.properties).forEach(([key, prop]) => {
      result.properties[key] = resolveSchema(prop, spec, isSwagger, visited);
    });
  }

  // Handle items (for arrays)
  if (schema.items) {
    result.items = resolveSchema(schema.items, spec, isSwagger, visited);
  }

  // Handle additionalProperties
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    result.additionalProperties = resolveSchema(schema.additionalProperties, spec, isSwagger, visited);
  }

  return result;
}

/**
 * Build a complete example object from a resolved schema
 * @param {Object} schema - The resolved schema
 * @param {number} depth - Current recursion depth (to prevent infinite loops)
 * @returns {any} Example data matching the schema
 */
export function buildExample(schema, depth = 0) {
  if (!schema || depth > 3) return undefined;

  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  switch (schema.type) {
    case 'string':
      if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
      if (schema.format === 'date') return '2024-01-01';
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
      return 'string';

    case 'number':
    case 'integer':
      return schema.minimum || 0;

    case 'boolean':
      return true;

    case 'array':
      if (schema.items) {
        return [buildExample(schema.items, depth + 1)];
      }
      return [];

    case 'object':
      if (schema.properties) {
        const obj = {};
        Object.entries(schema.properties).forEach(([key, prop]) => {
          obj[key] = buildExample(prop, depth + 1);
        });
        return obj;
      }
      return {};

    default:
      return null;
  }
}
