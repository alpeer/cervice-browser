// Sequelize Model validation schema
export const sequelizeModelSchema = {
  type: 'object',
  required: ['name', 'attributes'],
  properties: {
    name: { type: 'string', minLength: 1 },
    tableName: { type: 'string' },
    schema: { type: 'string' },
    timestamps: { type: 'boolean' },
    paranoid: { type: 'boolean' },
    underscored: { type: 'boolean' },
    freezeTableName: { type: 'boolean' },
    version: { oneOf: [{ type: 'boolean' }, { type: 'string' }] },
    createdAt: { oneOf: [{ type: 'boolean' }, { type: 'string' }] },
    updatedAt: { oneOf: [{ type: 'boolean' }, { type: 'string' }] },
    deletedAt: { oneOf: [{ type: 'boolean' }, { type: 'string' }] },

    attributes: {
      type: 'object',
      patternProperties: {
        '^.*$': {
          type: 'object',
          properties: {
            type: {}, // Can be string or DataTypes object
            allowNull: { type: 'boolean' },
            defaultValue: {},
            unique: { oneOf: [{ type: 'boolean' }, { type: 'string' }] },
            primaryKey: { type: 'boolean' },
            autoIncrement: { type: 'boolean' },
            autoIncrementIdentity: { type: 'boolean' },
            comment: { type: 'string' },
            field: { type: 'string' },

            // String/Text specific
            length: { type: 'number' },

            // Number specific
            precision: { type: 'number' },
            scale: { type: 'number' },
            unsigned: { type: 'boolean' },
            zerofill: { type: 'boolean' },

            // Enum specific
            values: { type: 'array', items: { type: 'string' } },

            // Validation
            validate: { type: 'object' },

            // Hooks
            get: {},
            set: {},

            // References (foreign keys)
            references: {
              type: 'object',
              required: ['model'],
              properties: {
                model: { type: 'string' },
                key: { type: 'string' }
              }
            },

            onUpdate: {
              type: 'string',
              enum: ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']
            },
            onDelete: {
              type: 'string',
              enum: ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']
            }
          }
        }
      }
    },

    associations: {
      type: 'object',
      patternProperties: {
        '^.*$': {
          type: 'object',
          required: ['type', 'target'],
          properties: {
            type: {
              type: 'string',
              enum: ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany']
            },
            target: { type: 'string' },
            as: { type: 'string' },
            foreignKey: {
              oneOf: [
                { type: 'string' },
                { type: 'object' }
              ]
            },
            sourceKey: { type: 'string' },
            targetKey: { type: 'string' },
            through: {
              oneOf: [
                { type: 'string' },
                { type: 'object' }
              ]
            },
            otherKey: {
              oneOf: [
                { type: 'string' },
                { type: 'object' }
              ]
            },
            scope: { type: 'object' },
            constraints: { type: 'boolean' },
            onDelete: {
              type: 'string',
              enum: ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']
            },
            onUpdate: {
              type: 'string',
              enum: ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']
            }
          }
        }
      }
    },

    indexes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          fields: {
            type: 'array',
            items: {
              oneOf: [
                { type: 'string' },
                {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    attribute: { type: 'string' },
                    length: { type: 'number' },
                    order: { type: 'string', enum: ['ASC', 'DESC'] },
                    collate: { type: 'string' }
                  }
                }
              ]
            },
            minItems: 1
          },
          unique: { type: 'boolean' },
          using: { type: 'string' },
          operator: { type: 'string' },
          type: { type: 'string' },
          where: { type: 'object' },
          concurrently: { type: 'boolean' },
          prefix: { type: 'string' },
          parser: { type: 'string' }
        }
      }
    },

    validate: { type: 'object' },
    hooks: { type: 'object' },
    defaultScope: { type: 'object' },
    scopes: { type: 'object' }
  }
};
