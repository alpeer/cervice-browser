import { AbstractEntity } from './AbstractEntity';

/**
 * Sequelize adapter for AbstractEntity
 */
export class SequelizeAdapter extends AbstractEntity {
  /**
   * Map OpenAPI types to Sequelize DataTypes
   */
  static TYPE_MAPPING = {
    string: 'STRING',
    integer: 'INTEGER',
    number: 'DECIMAL',
    boolean: 'BOOLEAN',
    array: 'JSON',
    object: 'JSON',
  };

  /**
   * Map OpenAPI formats to Sequelize DataTypes
   */
  static FORMAT_MAPPING = {
    'date-time': 'DATE',
    'date': 'DATEONLY',
    'email': 'STRING',
    'uuid': 'UUID',
    'uri': 'TEXT',
    'binary': 'BLOB',
  };

  /**
   * Convert to Sequelize model definition
   * @returns {Object} Sequelize model definition
   */
  toSequelize() {
    const attributes = {};

    // Add ID attribute
    attributes.id = {
      type: 'INTEGER',
      primaryKey: true,
      autoIncrement: true,
    };

    // Add fields from schema
    Object.entries(this.fields).forEach(([name, config]) => {
      const attributeDef = {
        type: this.getDataType(config),
        allowNull: !config.required,
      };

      // Add unique constraint
      if (config.unique) {
        attributeDef.unique = true;
      }

      // Add default value
      if (config.default !== undefined) {
        attributeDef.defaultValue = config.default;
      }

      // Add validation
      const validate = {};

      if (config.minLength) validate.len = [config.minLength, config.maxLength || Infinity];
      if (config.minimum !== undefined) validate.min = config.minimum;
      if (config.maximum !== undefined) validate.max = config.maximum;
      if (config.pattern) validate.is = new RegExp(config.pattern);
      if (config.format === 'email') validate.isEmail = true;
      if (config.format === 'uri') validate.isUrl = true;
      if (config.enum) validate.isIn = [config.enum];

      if (Object.keys(validate).length > 0) {
        attributeDef.validate = validate;
      }

      attributes[name] = attributeDef;
    });

    const options = {
      tableName: this.name.toLowerCase(),
      timestamps: this.options.timestamps || false,
      comment: this.options.description,
    };

    return {
      modelName: this.name,
      attributes,
      options,
    };
  }

  /**
   * Get Sequelize DataType from field config
   * @param {Object} config - Field configuration
   * @returns {string} Sequelize DataType
   */
  getDataType(config) {
    // Check format first (more specific)
    if (config.format && SequelizeAdapter.FORMAT_MAPPING[config.format]) {
      return SequelizeAdapter.FORMAT_MAPPING[config.format];
    }

    // Fall back to type mapping
    let type = SequelizeAdapter.TYPE_MAPPING[config.type] || 'STRING';

    // Add length for strings
    if (type === 'STRING' && config.maxLength) {
      type = `STRING(${config.maxLength})`;
    }

    return type;
  }

  /**
   * Generate Sequelize model code (as string)
   * @returns {string} Sequelize model code
   */
  generateModelCode() {
    const definition = this.toSequelize();

    let code = `import { DataTypes } from 'sequelize';\n\n`;
    code += `export function define${this.name}Model(sequelize) {\n`;
    code += `  return sequelize.define('${definition.modelName}', {\n`;

    Object.entries(definition.attributes).forEach(([name, config]) => {
      code += `    ${name}: {\n`;
      Object.entries(config).forEach(([key, value]) => {
        if (key === 'type') {
          code += `      type: DataTypes.${value},\n`;
        } else {
          code += `      ${key}: ${JSON.stringify(value)},\n`;
        }
      });
      code += `    },\n`;
    });

    code += `  }, ${JSON.stringify(definition.options, null, 4)});\n`;
    code += `}\n`;

    return code;
  }
}
