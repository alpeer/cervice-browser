import { EntitySchema } from 'typeorm'

const ExampleEntity = new EntitySchema({
  name: 'Example',
  tableName: 'example1',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    example: {
      type: 'varchar'
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
  },
})

export default ExampleEntity
