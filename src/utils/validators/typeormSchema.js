// TypeORM EntitySchema validation schema
export const typeormEntitySchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1 },
    tableName: { type: 'string' },
    database: { type: 'string' },
    schema: { type: 'string' },
    engine: { type: 'string' },

    columns: {
      type: 'object',
      patternProperties: {
        '^.*$': {
          type: 'object',
          properties: {
            type: { type: 'string' },
            primary: { type: 'boolean' },
            primaryKeyConstraintName: { type: 'string' },
            generated: {
              oneOf: [
                { type: 'boolean' },
                { type: 'string', enum: ['increment', 'uuid', 'rowid'] }
              ]
            },
            nullable: { type: 'boolean' },
            default: {},
            unique: { type: 'boolean' },
            comment: { type: 'string' },
            length: { type: ['string', 'number'] },
            width: { type: 'number' },
            precision: { type: 'number' },
            scale: { type: 'number' },
            zerofill: { type: 'boolean' },
            unsigned: { type: 'boolean' },
            charset: { type: 'string' },
            collation: { type: 'string' },
            enum: { type: 'array', items: { type: 'string' } },
            asExpression: { type: 'string' },
            generatedType: { type: 'string', enum: ['VIRTUAL', 'STORED'] },
            hstoreType: { type: 'string' },
            array: { type: 'boolean' },
            transformer: { type: 'object' },
            spatialFeatureType: { type: 'string' },
            srid: { type: 'number' },
            select: { type: 'boolean' },
            insert: { type: 'boolean' },
            update: { type: 'boolean' },
            name: { type: 'string' },
          }
        }
      }
    },

    relations: {
      type: 'object',
      patternProperties: {
        '^.*$': {
          type: 'object',
          required: ['type', 'target'],
          properties: {
            type: {
              type: 'string',
              enum: ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']
            },
            target: { type: 'string' },
            inverseSide: { type: 'string' },
            cascade: {
              oneOf: [
                { type: 'boolean' },
                { type: 'array', items: { type: 'string' } }
              ]
            },
            onDelete: {
              type: 'string',
              enum: ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']
            },
            onUpdate: {
              type: 'string',
              enum: ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']
            },
            nullable: { type: 'boolean' },
            orphanedRowAction: { type: 'string', enum: ['delete', 'soft-delete', 'disable'] },
            eager: { type: 'boolean' },
            lazy: { type: 'boolean' },
            persistence: { type: 'boolean' },
            primary: { type: 'boolean' },
            createForeignKeyConstraints: { type: 'boolean' },

            joinColumn: {
              oneOf: [
                { type: 'boolean' },
                {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    referencedColumnName: { type: 'string' },
                    foreignKeyConstraintName: { type: 'string' }
                  }
                },
                {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      referencedColumnName: { type: 'string' },
                      foreignKeyConstraintName: { type: 'string' }
                    }
                  }
                }
              ]
            },

            inverseJoinColumn: {
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    referencedColumnName: { type: 'string' }
                  }
                },
                {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      referencedColumnName: { type: 'string' }
                    }
                  }
                }
              ]
            },

            joinTable: {
              oneOf: [
                { type: 'boolean' },
                {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    database: { type: 'string' },
                    schema: { type: 'string' },
                    joinColumn: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        referencedColumnName: { type: 'string' },
                        foreignKeyConstraintName: { type: 'string' }
                      }
                    },
                    inverseJoinColumn: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        referencedColumnName: { type: 'string' },
                        foreignKeyConstraintName: { type: 'string' }
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },

    indices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          columns: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1
          },
          unique: { type: 'boolean' },
          spatial: { type: 'boolean' },
          fulltext: { type: 'boolean' },
          synchronize: { type: 'boolean' },
          where: { type: 'string' },
          sparse: { type: 'boolean' },
          nullFiltered: { type: 'boolean' }
        }
      }
    },

    uniques: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          columns: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1
          }
        }
      }
    },

    checks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          expression: { type: 'string' }
        }
      }
    },

    exclusions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          expression: { type: 'string' }
        }
      }
    },

    orderBy: {
      oneOf: [
        { type: 'string' },
        { type: 'object' }
      ]
    },

    synchronize: { type: 'boolean' },
    withoutRowid: { type: 'boolean' }
  }
};
