import { EntitySchema } from 'typeorm/entity-schema/EntitySchema.js'

const ProductEntity = new EntitySchema({
  name: 'Product',
  tableName: 'products',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true
    },
    sku: {
      type: 'varchar',
      length: 50,
      unique: true,
      nullable: false
    },
    name: {
      type: 'varchar',
      length: 255,
      nullable: false
    },
    description: {
      type: 'text',
      nullable: true
    },
    price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false
    },
    stock_quantity: {
      type: 'int',
      nullable: false,
      default: 0
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
      nullable: false
    }
  },
  relations: {
    category: {
      type: 'many-to-one',
      target: 'Category',
      joinColumn: {
        name: 'category_id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      nullable: true
    }
  },
  indices: [
    {
      name: 'idx_sku',
      columns: ['sku'],
      unique: true
    },
    {
      name: 'idx_category',
      columns: ['category_id']
    }
  ]
})

export default ProductEntity