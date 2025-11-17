/**
 * Utility functions to normalize between Swagger 2.0 and OpenAPI 3.x specs
 */

/**
 * Get schemas from spec (handles both Swagger 2.0 definitions and OpenAPI 3.x components.schemas)
 * @param {Object} spec - The specification object
 * @param {boolean} isSwagger - Whether this is a Swagger 2.0 spec
 * @returns {Object} Schemas object
 */
export function getSchemas(spec, isSwagger) {
  if (isSwagger) {
    return spec.definitions || {};
  }
  return spec.components?.schemas || {};
}

/**
 * Get paths from spec
 * @param {Object} spec - The specification object
 * @returns {Object} Paths object
 */
export function getPaths(spec) {
  return spec.paths || {};
}

/**
 * Get webhooks from spec (OpenAPI 3.1+ only)
 * @param {Object} spec - The specification object
 * @param {boolean} isSwagger - Whether this is a Swagger 2.0 spec
 * @returns {Object} Webhooks object
 */
export function getWebhooks(spec, isSwagger) {
  if (isSwagger) {
    return {}; // Swagger 2.0 doesn't support webhooks
  }
  return spec.webhooks || {};
}

/**
 * Determine if a schema name looks like a request/response wrapper
 * These should not be shown in the Objects view
 * @param {string} name - Schema name
 * @returns {boolean} True if it looks like a wrapper
 */
export function isRequestResponseWrapper(name) {
  const wrapperPatterns = [
    /Request$/i,
    /Response$/i,
    /Input$/i,
    /Output$/i,
    /Payload$/i,
    /Body$/i,
    /Dto$/i,
    /^Create[A-Z]/,
    /^Update[A-Z]/,
    /^Delete[A-Z]/,
    /^Get[A-Z]/,
    /^List[A-Z]/,
    /^Search[A-Z]/,
  ];

  return wrapperPatterns.some(pattern => pattern.test(name));
}

/**
 * Get only domain model schemas (filter out request/response wrappers)
 * @param {Object} schemas - All schemas
 * @returns {Object} Filtered schemas
 */
export function getDomainModels(schemas) {
  const filtered = {};

  Object.entries(schemas).forEach(([name, schema]) => {
    if (!isRequestResponseWrapper(name)) {
      filtered[name] = schema;
    }
  });

  return filtered;
}

/**
 * Get all referenced schema names from a schema object
 * @param {Object} schema - Schema object
 * @param {Set} refs - Accumulator for referenced schema names
 */
function collectRefs(schema, refs = new Set()) {
  if (!schema || typeof schema !== 'object') return refs;

  // Handle $ref
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    refs.add(refName);
  }

  // Handle arrays
  if (schema.items) {
    collectRefs(schema.items, refs);
  }

  // Handle properties
  if (schema.properties) {
    Object.values(schema.properties).forEach(prop => {
      collectRefs(prop, refs);
    });
  }

  // Handle allOf, anyOf, oneOf
  ['allOf', 'anyOf', 'oneOf'].forEach(key => {
    if (schema[key] && Array.isArray(schema[key])) {
      schema[key].forEach(subSchema => {
        collectRefs(subSchema, refs);
      });
    }
  });

  // Handle additionalProperties
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    collectRefs(schema.additionalProperties, refs);
  }

  return refs;
}

/**
 * Get schemas that are actually used/referenced by other schemas
 * @param {Object} schemas - All schemas
 * @returns {Object} Only referenced schemas
 */
export function getReferencedSchemas(schemas) {
  const referenced = new Set();

  // Collect all references from all schemas
  Object.values(schemas).forEach(schema => {
    collectRefs(schema, referenced);
  });

  const result = {};
  referenced.forEach(name => {
    if (schemas[name]) {
      result[name] = schemas[name];
    }
  });

  return result;
}
