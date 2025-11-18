import { EntitySchema } from 'typeorm/entity-schema/EntitySchema.js'

const UserEntity = new EntitySchema({
  name: 'User',
  tableName: 'users',
  indices: [
    {
      name: 'IDX_USER_USERNAME',
      unique: true,
      columns: ['username']
    },
    {
      name: 'IDX_USER_EMAIL',
      columns: ['email']
    }
  ],
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    username: {
      type: 'varchar',
      unique: true
    },
    email: {
      type: 'varchar',
      nullable: true
    },
    _created: {
      type: 'timestamp',
      createDate: true
    },
    _modified: {
      type: 'timestamp',
      updateDate: true,
      nullable: true
    }
  }
})

export default UserEntity
