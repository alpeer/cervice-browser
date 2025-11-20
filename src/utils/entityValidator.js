import Ajv from 'ajv';

// Lazy-loaded schemas
let typeormSchema = null;
let sequelizeSchema = null;
let ajvInstance = null;

// Initialize AJV instance
function getAjv() {
  if (!ajvInstance) {
    ajvInstance = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false, // Allow additional properties not in schema
    });
  }
  return ajvInstance;
}

// Lazy load TypeORM schema
async function getTypeormSchema() {
  if (!typeormSchema) {
    const module = await import('./validators/typeormSchema.js');
    typeormSchema = module.typeormEntitySchema;
  }
  return typeormSchema;
}

// Lazy load Sequelize schema
async function getSequelizeSchema() {
  if (!sequelizeSchema) {
    const module = await import('./validators/sequelizeSchema.js');
    sequelizeSchema = module.sequelizeModelSchema;
  }
  return sequelizeSchema;
}

/**
 * Validate TypeORM entity schema
 * @param {Object} entityData - Entity data to validate
 * @returns {Promise<{ valid: boolean, errors: Array }>}
 */
export async function validateTypeormEntity(entityData) {
  try {
    const schema = await getTypeormSchema();
    const ajv = getAjv();
    const validate = ajv.compile(schema);
    const valid = validate(entityData);

    if (!valid) {
      return {
        valid: false,
        errors: validate.errors.map(err => ({
          path: err.instancePath || err.dataPath,
          message: err.message,
          params: err.params,
        })),
      };
    }

    return { valid: true, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: [{ path: 'root', message: `Validation error: ${error.message}` }],
    };
  }
}

/**
 * Validate Sequelize model schema
 * @param {Object} modelData - Model data to validate
 * @returns {Promise<{ valid: boolean, errors: Array }>}
 */
export async function validateSequelizeModel(modelData) {
  try {
    const schema = await getSequelizeSchema();
    const ajv = getAjv();
    const validate = ajv.compile(schema);
    const valid = validate(modelData);

    if (!valid) {
      return {
        valid: false,
        errors: validate.errors.map(err => ({
          path: err.instancePath || err.dataPath,
          message: err.message,
          params: err.params,
        })),
      };
    }

    return { valid: true, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: [{ path: 'root', message: `Validation error: ${error.message}` }],
    };
  }
}

/**
 * Auto-detect entity type and validate
 * @param {Object} entityData - Entity data to validate
 * @returns {Promise<{ valid: boolean, type: string, errors: Array }>}
 */
export async function validateEntity(entityData) {
  // Try to detect entity type
  const hasTypeormFields = entityData.name && (entityData.columns || entityData.relations);
  const hasSequelizeFields = entityData.name && entityData.attributes;

  if (hasTypeormFields && !hasSequelizeFields) {
    const result = await validateTypeormEntity(entityData);
    return { ...result, type: 'typeorm' };
  }

  if (hasSequelizeFields && !hasTypeormFields) {
    const result = await validateSequelizeModel(entityData);
    return { ...result, type: 'sequelize' };
  }

  // Try both and return the one that passes
  const typeormResult = await validateTypeormEntity(entityData);
  if (typeormResult.valid) {
    return { ...typeormResult, type: 'typeorm' };
  }

  const sequelizeResult = await validateSequelizeModel(entityData);
  if (sequelizeResult.valid) {
    return { ...sequelizeResult, type: 'sequelize' };
  }

  // Neither passed, return TypeORM errors as it's more common
  return { ...typeormResult, type: 'unknown' };
}

/**
 * Format validation errors for display
 * @param {Array} errors - Array of error objects
 * @returns {string} - Formatted error message
 */
export function formatValidationErrors(errors) {
  if (!errors || errors.length === 0) {
    return 'Unknown validation error';
  }

  return errors
    .map(err => {
      const path = err.path || 'root';
      const message = err.message || 'Invalid value';
      return `${path}: ${message}`;
    })
    .join('; ');
}
