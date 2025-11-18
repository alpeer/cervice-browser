import { EntitySchema } from 'typeorm/entity-schema/EntitySchema.js'

const OrderItemEntity = new EntitySchema({
  name: 'OrderItem',
  tableName: 'order_items',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      nullable: false
    },
    quantity: {
      type: 'int',
      nullable: false
    },
    unit_price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false
    },
    subtotal: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false
    }
  },
  relations: {
    order: {
      type: 'many-to-one',
      target: 'Order',
      joinColumn: {
        name: 'order_id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      nullable: false
    },
    product: {
      type: 'many-to-one',
      target: 'Product',
      joinColumn: {
        name: 'product_id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      nullable: false
    }
  },
  indices: [
    {
      name: 'idx_order_id',
      columns: ['order_id']
    },
    {
      name: 'idx_product_id',
      columns: ['product_id']
    },
    {
      name: 'idx_order_product',
      columns: ['order_id', 'product_id'],
      unique: true
    }
  ]
})

export default OrderItemEntity