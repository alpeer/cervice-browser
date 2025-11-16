import { AbstractEntity } from './AbstractEntity';

/**
 * TypeORM adapter for AbstractEntity
 */
export class TypeORMAdapter extends AbstractEntity {
  /**
   * Map OpenAPI types to TypeORM column types
   */
  static TYPE_MAPPING = {
    string: 'varchar',
    integer: 'int',
    number: 'decimal',
    boolean: 'boolean',
    array: 'json',
    object: 'json',
  };

  /**
   * Map OpenAPI formats to TypeORM column types
   */
  static FORMAT_MAPPING = {
    'date-time': 'timestamp',
    'date': 'date',
    'email': 'varchar',
    'uuid': 'uuid',
    'uri': 'text',
    'binary': 'bytea',
  };

  /**
   * Convert to TypeORM EntitySchema
   * @returns {Object} TypeORM entity schema
   */
  toTypeORM() {
    const columns = {};

    // Add ID column
    columns.id = {
      type: 'int',
      primary: true,
      generated: true,
    };

    // Add fields from schema
    Object.entries(this.fields).forEach(([name, config]) => {
      const columnDef = {
        type: this.getColumnType(config),
        nullable: !config.required,
      };

      // Add length constraint for strings
      if (config.type === 'string' && config.maxLength) {
        columnDef.length = config.maxLength;
      }

      // Add unique constraint
      if (config.unique) {
        columnDef.unique = true;
      }

      // Add default value
      if (config.default !== undefined) {
        columnDef.default = config.default;
      }

      columns[name] = columnDef;
    });

    // Add timestamp columns if enabled
    if (this.options.timestamps) {
      columns.createdAt = {
        type: 'timestamp',
        createDate: true,
      };
      columns.updatedAt = {
        type: 'timestamp',
        updateDate: true,
      };
    }

    return {
      name: this.name,
      columns,
      options: {
        comment: this.options.description,
      },
    };
  }

  /**
   * Get TypeORM column type from field config
   * @param {Object} config - Field configuration
   * @returns {string} TypeORM column type
   */
  getColumnType(config) {
    // Check format first (more specific)
    if (config.format && TypeORMAdapter.FORMAT_MAPPING[config.format]) {
      return TypeORMAdapter.FORMAT_MAPPING[config.format];
    }

    // Fall back to type mapping
    return TypeORMAdapter.TYPE_MAPPING[config.type] || 'varchar';
  }

  /**
   * Generate TypeORM entity class code (as string)
   * @returns {string} TypeORM entity class code
   */
  generateEntityCode() {
    const schema = this.toTypeORM();

    let code = `import { EntitySchema } from 'typeorm';\n\n`;
    code += `export const ${this.name}Entity = new EntitySchema({\n`;
    code += `  name: '${schema.name}',\n`;
    code += `  columns: ${JSON.stringify(schema.columns, null, 4)},\n`;
    code += `});\n`;

    return code;
  }
}
