import { EntitySchema } from 'typeorm'

const OrderEntity = new EntitySchema({
  name: 'Order',
  tableName: 'orders',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      nullable: false
    },
    order_number: {
      type: 'varchar',
      length: 50,
      unique: true,
      nullable: false
    },
    total_amount: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false
    },
    status: {
      type: 'enum',
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      nullable: false,
      default: 'pending'
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
      nullable: false
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
      nullable: false
    }
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'user_id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      nullable: false
    },
    items: {
      type: 'one-to-many',
      target: 'OrderItem',
      inverseSide: 'order'
    }
  },
  indices: [
    {
      name: 'idx_user_id',
      columns: ['user_id']
    },
    {
      name: 'idx_order_number',
      columns: ['order_number'],
      unique: true
    },
    {
      name: 'idx_status',
      columns: ['status']
    }
  ]
})

export default OrderEntity