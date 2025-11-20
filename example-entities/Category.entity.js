import { EntitySchema } from 'typeorm/entity-schema/EntitySchema.js'

const CategoryEntity = new EntitySchema({
  name: 'Category',
  tableName: 'categories',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      nullable: false
    },
    name: {
      type: 'varchar',
      length: 100,
      unique: true,
      nullable: false
    },
    description: {
      type: 'text',
      nullable: true
    }
  },
  relations: {
    parent: {
      type: 'many-to-one',
      target: 'Category',
      joinColumn: {
        name: 'parent_id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      nullable: true
    },
    children: {
      type: 'one-to-many',
      target: 'Category',
      inverseSide: 'parent'
    },
    products: {
      type: 'one-to-many',
      target: 'Product',
      inverseSide: 'category'
    }
  },
  indices: [
    {
      name: 'idx_name',
      columns: ['name'],
      unique: true
    },
    {
      name: 'idx_parent',
      columns: ['parent_id']
    }
  ]
})

export default CategoryEntity