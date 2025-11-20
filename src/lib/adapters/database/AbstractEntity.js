/**
 * Abstract base class for database entities
 */
export class AbstractEntity {
  constructor(name, fields, options = {}) {
    this.name = name;
    this.fields = fields; // { fieldName: { type, required, unique, format, etc } }
    this.options = options; // Additional entity options (timestamps, indexes, etc)
  }

  /**
   * Convert to TypeORM EntitySchema format
   * @returns {Object} TypeORM entity schema
   */
  toTypeORM() {
    throw new Error('toTypeORM() must be implemented by adapter');
  }

  /**
   * Convert to Sequelize model definition
   * @returns {Object} Sequelize model definition
   */
  toSequelize() {
    throw new Error('toSequelize() must be implemented by adapter');
  }

  /**
   * Create entity from OpenAPI schema
   * @param {string} schemaName - Schema name
   * @param {Object} schema - OpenAPI schema object
   * @returns {AbstractEntity} Entity instance
   */
  static fromSchema(schemaName, schema) {
    const fields = {};

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([name, config]) => {
        fields[name] = {
          type: config.type,
          required: schema.required?.includes(name) || false,
          format: config.format,
          description: config.description,
          enum: config.enum,
          minimum: config.minimum,
          maximum: config.maximum,
          minLength: config.minLength,
          maxLength: config.maxLength,
          pattern: config.pattern,
        };
      });
    }

    const options = {
      description: schema.description,
      timestamps: true, // Add createdAt/updatedAt by default
    };

    return new AbstractEntity(schemaName, fields, options);
  }

  /**
   * Get field names
   * @returns {string[]} Array of field names
   */
  getFieldNames() {
    return Object.keys(this.fields);
  }

  /**
   * Get required fields
   * @returns {string[]} Array of required field names
   */
  getRequiredFields() {
    return Object.entries(this.fields)
      .filter(([, config]) => config.required)
      .map(([name]) => name);
  }
}
